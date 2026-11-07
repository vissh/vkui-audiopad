import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

const token = { accessToken: 'synthetic', userId: '1', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null }
const setup = async () => {
  const browser = createChrome({ userId: '1', webToken: token, currentPlaylist: { synthetic: true } })
  const api = await import('../../packages/common/src/vk-api-client')
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  return { ...browser, ...api }
}

it.each([
  [200, { error: { error_code: 6, error_msg: 'synthetic-private-value' } }, 'rate-limit'],
  [200, { error: { error_code: 15, error_msg: 'synthetic-private-value' } }, 'vk'],
  [429, { error: { error_code: 5 } }, 'rate-limit'],
  [503, { error: { error_code: 5 } }, 'http'],
  [200, {}, 'format'],
  [200, [], 'format']
] as const)('rejects HTTP %s / %j instead of reporting success', async (status, payload, kind) => {
  const api = await setup()
  const network = vi.fn(async () => new Response(JSON.stringify(payload), { status }))
  vi.stubGlobal('fetch', network)
  await expect(api.request('https://api.vk.ru/method/audio.delete', 'POST', {})).rejects.toMatchObject({ name: 'VKApiError', kind })
  expect(network).toHaveBeenCalledOnce()
  expect(api.snapshot().webToken).toEqual(token)
})

it('does not serialize upstream messages or payloads in a request error', async () => {
  const api = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"error_code":15,"error_msg":"synthetic-private-value","request_params":[{"access_token":"synthetic-private-value"}]}}')))
  const error: unknown = await api.request('https://api.vk.ru/method/audio.delete', 'POST', {}).catch(error => error)
  const { serializeError } = await import('serialize-error')
  expect(JSON.stringify(serializeError(error))).not.toContain('synthetic-private-value')
})

it('sends GET parameters in the URL without a body and does not modify the input', async () => {
  const api = await setup()
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{"response":1}'))
  vi.stubGlobal('fetch', network)
  const params = Object.freeze({ q: 'synthetic value' })
  expect(await api.request('https://api.vk.ru/method/test?v=5.246', 'GET', params)).toEqual({ response: 1 })
  expect(network.mock.calls[0][1]?.body).toBeUndefined()
  const url = new URL(String(network.mock.calls[0][0]))
  expect(url.searchParams.get('q')).toBe('synthetic value')
  expect(url.searchParams.get('v')).toBe('5.246')
  expect(params).toEqual({ q: 'synthetic value' })
})

it('refreshes once for error 5 and rejects a second authorization failure', async () => {
  const api = await setup()
  const network = vi.fn(async (_input: RequestInfo | URL) => new Response('{"error":{"error_code":5}}'))
  network.mockResolvedValueOnce(new Response('{"error":{"error_code":5}}'))
  network.mockResolvedValueOnce(new Response(JSON.stringify({ type: 'okay', data: { user_id: 1, access_token: 'new-synthetic', expires: Number.MAX_SAFE_INTEGER, logout_hash: '' } })))
  vi.stubGlobal('fetch', network)
  await expect(api.request('https://api.vk.ru/method/test', 'POST', {})).rejects.toMatchObject({ kind: 'unauthorized' })
  expect(network).toHaveBeenCalledTimes(3)
})

it('does not call a method with an empty token after an unauthorized refresh', async () => {
  const api = await setup()
  const network = vi.fn(async () => new Response('{"error":{"error_code":5}}'))
  network.mockResolvedValueOnce(new Response('{"error":{"error_code":5}}'))
  network.mockResolvedValueOnce(new Response('{"type":"error","error_info":"unauthorized"}'))
  vi.stubGlobal('fetch', network)
  await expect(api.request('https://api.vk.ru/method/test', 'POST', {})).rejects.toMatchObject({ kind: 'unauthorized' })
  expect(network).toHaveBeenCalledTimes(2)
  expect(api.snapshot().webToken).toEqual(token)
})

it('bounds an ignored-abort response with a deadline and does not retry it', async () => {
  vi.useFakeTimers()
  const api = await setup()
  const network = controlledFetch()
  const pending = expect(api.request('https://api.vk.ru/method/test', 'POST', {})).rejects.toMatchObject({ kind: 'timeout' })
  await vi.advanceTimersByTimeAsync(15_000)
  await pending
  expect(network.requests).toHaveLength(1)
  expect(network.requests[0].init?.signal?.aborted).toBe(true)
  network.requests[0].resolve(new Response('{"error":{"error_code":5}}'))
  await vi.advanceTimersByTimeAsync(0)
  expect(network.requests).toHaveLength(1)
  expect(vi.getTimerCount()).toBe(0)
})

it('uses one budget for a request plus a delayed token refresh and rejects its late completion', async () => {
  vi.useFakeTimers()
  const api = await setup()
  const network = controlledFetch()
  const pending = expect(api.request('https://api.vk.ru/method/test', 'POST', {})).rejects.toMatchObject({ kind: 'timeout' })
  await vi.advanceTimersByTimeAsync(14_000)
  network.requests[0].resolve(new Response('{"error":{"error_code":5}}'))
  await vi.advanceTimersByTimeAsync(0)
  expect(network.requests).toHaveLength(2)
  await vi.advanceTimersByTimeAsync(1000)
  await pending
  network.requests[1].resolve(new Response(JSON.stringify({ type: 'okay', data: { user_id: 1, access_token: 'late-synthetic', expires: Number.MAX_SAFE_INTEGER, logout_hash: '' } })))
  await vi.advanceTimersByTimeAsync(0)
  expect(network.requests).toHaveLength(2)
  expect(api.snapshot().webToken).toEqual(token)
  expect(vi.getTimerCount()).toBe(0)
})

it('can refresh a single HTTP 401 and uses the new token for the retry', async () => {
  const api = await setup()
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{"response":1}'))
  network.mockResolvedValueOnce(new Response('{}', { status: 401 }))
  network.mockResolvedValueOnce(new Response(JSON.stringify({ type: 'okay', data: { user_id: 1, access_token: 'new-synthetic', expires: Number.MAX_SAFE_INTEGER, logout_hash: '' } })))
  vi.stubGlobal('fetch', network)
  expect(await api.request('https://api.vk.ru/method/test', 'POST', {})).toEqual({ response: 1 })
  expect(network).toHaveBeenCalledTimes(3)
  expect((network.mock.calls[2][1]?.body as URLSearchParams).get('access_token')).toBe('new-synthetic')
})

it('does not call VK or clear state after a failed token-storage read', async () => {
  const api = await setup()
  api.failNextStorageOperation('synthetic-storage-failure')
  const network = vi.fn()
  vi.stubGlobal('fetch', network)
  await expect(api.request('https://api.vk.ru/method/test', 'POST', {})).rejects.toMatchObject({ kind: 'unavailable' })
  expect(network).not.toHaveBeenCalled()
  expect(api.snapshot().webToken).toEqual(token)
})
