import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

const token = { userId: '1', accessToken: 'old-synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null }
const fresh = (userId = '1') => new Response(JSON.stringify({ type: 'okay', data: { user_id: userId, access_token: `fresh-synthetic-${userId}`, expires: Number.MAX_SAFE_INTEGER, logout_hash: '' } }))
const setup = async () => {
  vi.useFakeTimers()
  const browser = createChrome({ userId: '1', webToken: token, deviceId: 'device', currentPlaylist: { synthetic: true } })
  const network = controlledFetch()
  const api = await import('../../packages/common/src/vk-api-client')
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  const controller = new AbortController()
  const request = () => api.request('https://api.vk.ru/method/test', 'POST', {}, controller.signal).catch((error: unknown) => error)
  return { ...browser, ...network, ...api, controller, request }
}

it('shares a token refresh across concurrent rejected API requests', async () => {
  const page = await setup()
  const pending = [page.request(), page.request()]
  try {
    await vi.waitFor(() => { expect(page.requests).toHaveLength(2) })
    page.requests.slice(0, 2).forEach(request => { request.resolve(new Response('{"error":{"error_code":5}}')) })
    await vi.waitFor(() => { expect(page.requests.length).toBeGreaterThanOrEqual(3) })
    await vi.advanceTimersByTimeAsync(0)
    expect(page.requests.filter(request => String(request.url).includes('login.vk.ru'))).toHaveLength(1)
    page.requests[2].resolve(fresh())
    await vi.waitFor(() => { expect(page.requests).toHaveLength(5) })
    page.requests.slice(3).forEach(request => { request.resolve(new Response('{"response":1}')) })
    expect(await Promise.all(pending)).toEqual([{ response: 1 }, { response: 1 }])
  } finally {
    page.controller.abort()
    await Promise.all(pending)
  }
})

it('does not overwrite a newer account with a late token refresh or replay its method', async () => {
  const page = await setup()
  const pending = page.request()
  try {
    await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
    page.requests[0].resolve(new Response('{"error":{"error_code":5}}'))
    await vi.waitFor(() => { expect(page.requests).toHaveLength(2) })
    const next = { ...token, userId: '2', accessToken: 'account-two-synthetic' }
    await page.api.storage.local.set({ userId: '2', webToken: next })
    page.requests[1].resolve(fresh())
    await vi.waitFor(() => { expect(page.snapshot().webToken).toEqual(next) })
    await vi.advanceTimersByTimeAsync(0)
    expect(page.snapshot().webToken).toEqual(next)
    expect(page.requests).toHaveLength(2)
    expect(await pending).toMatchObject({ kind: 'session-changed' })
  } finally {
    page.controller.abort()
    await pending
  }
})

it('rejects a late successful method response after its account has changed', async () => {
  const page = await setup()
  const pending = page.request()
  try {
    await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
    await page.api.storage.local.set({ userId: '2', webToken: { ...token, userId: '2', accessToken: 'account-two-synthetic' } })
    page.requests[0].resolve(new Response('{"response":1}'))
    expect(await pending).toMatchObject({ kind: 'session-changed' })
  } finally {
    page.controller.abort()
    await pending
  }
})

it('rejects a prior-session method even when the account ID is unchanged', async () => {
  const page = await setup()
  const pending = page.request()
  try {
    await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
    await page.api.storage.local.set({ sessionEpoch: 'new-session-same-user' })
    expect(await pending).toMatchObject({ kind: 'session-changed' })
    expect(page.requests[0].init?.signal?.aborted).toBe(true)
    page.requests[0].resolve(new Response('{"response":1}'))
  } finally {
    page.controller.abort()
    await pending
  }
})
