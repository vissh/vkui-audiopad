import { type commonTypes } from '@vk-audiopad/common'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { playlist } from '../helpers/playback'
import { deferred } from '../helpers/deferred'

afterEach(() => { vi.doUnmock('@vk-audiopad/common') })

const token: commonTypes.WebToken = { userId: '1', accessToken: 'synthetic-token', expires: Number.MAX_SAFE_INTEGER, logoutHash: 'synthetic-hash', error: null }
const saved = () => ({ userId: '1', webToken: token, deviceId: 'device', currentPlaylist: playlist(['1_1']), audiosIds: [['1_1', '']], played: false, volume: 0.4 })

const session = async () => {
  const browser = createChrome(saved())
  const fetchToken = vi.fn(async (_signal?: AbortSignal) => token)
  vi.doMock('@vk-audiopad/common', async importOriginal => {
    const original = await importOriginal<typeof import('@vk-audiopad/common')>()
    return { ...original, vkApiClient: { ...original.vkApiClient, fetchAppWebToken: fetchToken } }
  })
  const { fetchWebToken } = await import('../../packages/front/src/features/sign-in/lib/api')
  const { updateWebToken } = await import('../../packages/front/src/features/sign-in/lib/storage')
  return { ...browser, fetchToken, fetchWebToken, updateWebToken }
}

it('retains the session and queue when a token check fails with a network exception', async () => {
  const browser = await session()
  browser.fetchToken.mockRejectedValueOnce(new Error('synthetic network failure'))
  const result = await browser.fetchWebToken()
  await browser.updateWebToken(result)
  await browser.api.storage.local.get()
  expect(result.error?.type).toBe('exception')
  expect(browser.snapshot()).toEqual(saved())
})

it.each([
  { status: 503, payload: { error: { error_code: 5 } } },
  { status: 429, payload: { error: { error_code: 6 } } },
  { status: 200, payload: { error: { error_code: 6 } } },
  { status: 200, payload: {} },
  { status: 200, payload: { response: null } },
  { status: 200, payload: { response: false } },
  { status: 200, payload: { response: [] } }
])('preserves session data for an inconclusive profile response: $status $payload', async ({ status, payload }) => {
  const browser = await session()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload), { status })))
  const result = await browser.fetchWebToken()
  expect(result.error?.type).toBe('exception')
  await browser.updateWebToken(result)
  await browser.api.storage.local.get()
  expect(browser.snapshot()).toEqual(saved())
})

it('does not send the profile check with an explicitly unauthorized empty token', async () => {
  const browser = await session()
  const { vkApiClient } = await import('@vk-audiopad/common')
  browser.fetchToken.mockResolvedValueOnce(vkApiClient.UnauthorizedWebToken)
  const network = vi.fn(async () => new Response('{"response":{}}'))
  vi.stubGlobal('fetch', network)
  expect((await browser.fetchWebToken()).error?.type).toBe('unauthorized')
  expect(network).not.toHaveBeenCalled()
})

it('does not serialize sensitive upstream details into the session failure result', async () => {
  const browser = await session()
  browser.fetchToken.mockRejectedValueOnce(new Error('access_token=private-test-value'))
  expect(JSON.stringify(await browser.fetchWebToken())).not.toContain('private-test-value')
})

it.each([
  { status: 401, payload: {} },
  { status: 200, payload: { error: { error_code: 5 } } }
])('retains the explicit logout policy for confirmed authorization failure: $status', async ({ status, payload }) => {
  const browser = await session()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload), { status })))
  const result = await browser.fetchWebToken()
  expect(result.error?.type).toBe('unauthorized')
  await browser.updateWebToken(result)
  expect(browser.snapshot()).toEqual({ volume: 0.4 })
})

it('persists a verified same-account token without clearing associated data', async () => {
  const browser = await session()
  const next = { ...token, accessToken: 'fresh-synthetic-token' }
  browser.fetchToken.mockResolvedValueOnce(next)
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"response":{}}')))
  const result = await browser.fetchWebToken()
  await browser.updateWebToken(result)
  expect(browser.snapshot()).toEqual({ ...saved(), webToken: next })
  expect(browser.api.storage.local.remove).not.toHaveBeenCalled()
})

it('does not submit an incomplete token as evidence for logging the user out', async () => {
  const browser = await session()
  browser.fetchToken.mockResolvedValueOnce({ ...token, accessToken: '' })
  expect((await browser.fetchWebToken()).error?.type).toBe('exception')
  expect(fetch).not.toHaveBeenCalled()
})

it('bounds a stalled token read even if its adapter ignores cancellation', async () => {
  vi.useFakeTimers()
  const browser = await session()
  const response = deferred<commonTypes.WebToken>()
  browser.fetchToken.mockReturnValueOnce(response.promise)
  const pending = browser.fetchWebToken()
  await vi.advanceTimersByTimeAsync(15_000)
  const result = await pending
  expect(result.error?.type).toBe('exception')
  await browser.updateWebToken(result)
  expect(browser.snapshot()).toEqual(saved())
  response.resolve(token)
  await vi.advanceTimersByTimeAsync(0)
  expect(fetch).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})

it('propagates caller cancellation without converting it to logout or a retry result', async () => {
  const browser = await session()
  const response = deferred<commonTypes.WebToken>()
  browser.fetchToken.mockReturnValueOnce(response.promise)
  const controller = new AbortController()
  const pending = expect(browser.fetchWebToken(controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  controller.abort()
  await pending
  response.resolve(token)
  await Promise.resolve()
  expect(browser.snapshot()).toEqual(saved())
  expect(fetch).not.toHaveBeenCalled()
})

it('does not publish a new account identity until old account data has been removed', async () => {
  const browser = await session()
  const next = { ...token, userId: '2' }
  const release = deferred<void>()
  const remove = browser.api.storage.local.remove.getMockImplementation()!
  browser.api.storage.local.remove.mockImplementationOnce(async (keys, callback) => {
    await release.promise
    await remove(keys, callback)
  })
  const pending = browser.updateWebToken(next)
  await vi.waitFor(() => { expect(browser.api.storage.local.remove).toHaveBeenCalledOnce() })
  expect(browser.snapshot().userId).toBe('1')
  release.resolve()
  await pending
  expect(browser.snapshot()).toMatchObject({ userId: '2', webToken: next, volume: 0.4 })
  expect(browser.snapshot()).not.toHaveProperty('currentPlaylist')
  expect(browser.snapshot().deviceId).not.toBe('device')
})

it('surfaces a cleanup failure before publishing another account and can retry', async () => {
  const browser = await session()
  const next = { ...token, userId: '2' }
  browser.api.storage.local.remove.mockRejectedValueOnce(new Error('Cleanup failed'))
  await expect(browser.updateWebToken(next)).rejects.toThrow('Cleanup failed')
  expect(browser.snapshot()).toEqual(saved())
  await browser.updateWebToken(next)
  expect(browser.snapshot().userId).toBe('2')
})

it('uses one shared deadline for token acquisition and a stalled profile check', async () => {
  vi.useFakeTimers()
  const browser = await session()
  const tokenResponse = deferred<commonTypes.WebToken>()
  const profileResponse = deferred<Response>()
  browser.fetchToken.mockReturnValueOnce(tokenResponse.promise)
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => await profileResponse.promise)
  vi.stubGlobal('fetch', network)
  const pending = browser.fetchWebToken()
  await vi.advanceTimersByTimeAsync(14_000)
  tokenResponse.resolve(token)
  await vi.advanceTimersByTimeAsync(0)
  expect(network).toHaveBeenCalledOnce()
  await vi.advanceTimersByTimeAsync(1000)
  expect((await pending).error?.type).toBe('exception')
  expect(network.mock.calls[0][1]?.signal?.aborted).toBe(true)
  profileResponse.resolve(new Response('{"response":{}}'))
  await vi.advanceTimersByTimeAsync(0)
  expect(browser.snapshot()).toEqual(saved())
  expect(vi.getTimerCount()).toBe(0)
})

it('cancels a session write while its storage read is pending', async () => {
  const browser = await session()
  const release = deferred<void>()
  const read = browser.api.storage.local.get.getMockImplementation()!
  browser.api.storage.local.get.mockImplementationOnce(async (keys, callback) => {
    await release.promise
    return await read(keys, callback)
  })
  const controller = new AbortController()
  const pending = expect(browser.updateWebToken(token, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  await vi.waitFor(() => { expect(browser.api.storage.local.get).toHaveBeenCalledOnce() })
  controller.abort()
  release.resolve()
  await pending
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  expect(browser.snapshot()).toEqual(saved())
})
