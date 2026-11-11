import { expect, it, vi } from 'vitest'
import { serializeError } from 'serialize-error'
import { controlledFetch } from '../helpers/fetch'
import { createChrome } from '../helpers/chrome'

it('explains a repeated HTML response without retaining its body, URL or parameters', async () => {
  const { request } = await import('../../packages/common/src/vk-client')
  const network = vi.fn(async () => new Response('<html>private-response-token</html>', { headers: { 'Content-Type': 'text/html; private-header-token' } }))
  vi.stubGlobal('fetch', network)
  const error: unknown = await request('https://vk.ru/al_audio.php?act=section&access_token=private-url-token', { q: 'private-query-token' }).catch(error => error)
  expect(error).toMatchObject({ kind: 'format', operation: 'section', stage: 'retry', attempt: 2, status: 200, contentType: 'html', redirected: false })
  expect(network).toHaveBeenCalledTimes(3)
  expect(JSON.stringify(serializeError(error))).not.toMatch(/private-(response|header|url|query)-token/)
})

it.each([401, 429, 503])('does not reconnect or clear data after legacy HTTP %s', async status => {
  const browser = createChrome({ userId: '1', webToken: 'synthetic', currentPlaylist: 'synthetic' })
  const network = vi.fn(async () => new Response('<html>private-response</html>', { status, headers: { 'Content-Type': 'text/html' } }))
  vi.stubGlobal('fetch', network)
  const { request } = await import('../../packages/common/src/vk-client')
  await expect(request('https://vk.ru/al_audio.php?act=section', {})).rejects.toMatchObject({ kind: status === 429 ? 'rate-limit' : 'http', status, operation: 'section', stage: 'request', attempt: 1 })
  expect(network).toHaveBeenCalledOnce()
  expect(browser.api.storage.local.remove).not.toHaveBeenCalled()
  expect(browser.snapshot()).toEqual({ userId: '1', webToken: 'synthetic', currentPlaylist: 'synthetic' })
})

it('rejects a repeated legacy reconnect envelope instead of returning it as data', async () => {
  const network = vi.fn(async () => new Response('{"payload":["3",[]]}'))
  vi.stubGlobal('fetch', network)
  const { request } = await import('../../packages/common/src/vk-client')
  await expect(request('https://vk.ru/al_audio.php?act=section', {})).rejects.toMatchObject({ kind: 'unavailable', stage: 'retry', attempt: 2 })
  expect(network).toHaveBeenCalledTimes(3)
})

it('does not replay a legacy mutation after an ambiguous malformed response', async () => {
  const network = vi.fn(async () => new Response('<html></html>'))
  vi.stubGlobal('fetch', network)
  const { request } = await import('../../packages/common/src/vk-client')
  await expect(request('https://vk.ru/al_audio.php?act=add', {}, undefined, { retryAfterReconnect: false })).rejects.toMatchObject({ kind: 'format', operation: 'add', attempt: 1 })
  expect(network).toHaveBeenCalledOnce()
})

it('bounds the whole legacy reconnect and ignores a late response without another request', async () => {
  vi.useFakeTimers()
  const network = controlledFetch()
  const { request } = await import('../../packages/common/src/vk-client')
  const failure = expect(request('https://vk.ru/al_audio.php?act=section', {})).rejects.toMatchObject({ kind: 'timeout', stage: 'reconnect', attempt: 1 })
  network.requests[0].resolve(new Response('not json'))
  await vi.advanceTimersByTimeAsync(0)
  expect(network.requests).toHaveLength(2)
  await vi.advanceTimersByTimeAsync(15_000)
  await failure
  network.requests[1].resolve(new Response('late'))
  await vi.advanceTimersByTimeAsync(0)
  expect(network.requests).toHaveLength(2)
  expect(vi.getTimerCount()).toBe(0)
})

it('preserves caller cancellation and does not turn a late malformed body into a reconnect', async () => {
  const network = controlledFetch()
  const controller = new AbortController()
  const reason = new Error('caller cancellation')
  const { request } = await import('../../packages/common/src/vk-client')
  const failure = expect(request('https://vk.ru/al_audio.php?act=section', {}, controller.signal)).rejects.toBe(reason)
  controller.abort(reason)
  await failure
  network.requests[0].resolve(new Response('not json'))
  await vi.waitFor(() => { expect(network.requests[0].init?.signal?.aborted).toBe(true) })
  expect(network.requests).toHaveLength(1)
})

it('keeps error metadata across worker replies while preserving the session after HTML token failure', async () => {
  const initial = { userId: '1', sessionEpoch: 'one', webToken: { userId: '1', accessToken: 'synthetic', expires: 0, logoutHash: '', error: null }, currentPlaylist: { synthetic: true }, volume: 0.4 }
  const browser = createChrome(initial)
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  const { requestSession } = await import('../../packages/common/src/session-client')
  vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>private-response</html>', { headers: { 'Content-Type': 'text/html' } })))
  await expect(requestSession({ kind: 'verify' })).rejects.toMatchObject({ kind: 'format', operation: 'web_token', stage: 'retry', status: 200, contentType: 'html', attempt: 2 })
  expect(browser.snapshot()).toEqual(initial)
  expect(browser.api.storage.local.remove).not.toHaveBeenCalled()
})

it.each([200, 503])('preserves the session and diagnoses an HTTP %s HTML profile failure', async status => {
  const initial = { userId: '1', sessionEpoch: 'one', webToken: { userId: '1', accessToken: 'synthetic', expires: 0, logoutHash: '', error: null }, currentPlaylist: { synthetic: true }, volume: 0.4 }
  const browser = createChrome(initial)
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  const { requestSession } = await import('../../packages/common/src/session-client')
  const network = vi.fn(async (input: RequestInfo | URL) => String(input).includes('login.vk.ru')
    ? new Response(JSON.stringify({ type: 'okay', data: { user_id: '1', access_token: 'fresh-synthetic', expires: Number.MAX_SAFE_INTEGER, logout_hash: '' } }))
    : new Response('<html>private-response</html>', { status, headers: { 'Content-Type': 'text/html' } }))
  vi.stubGlobal('fetch', network)
  await expect(requestSession({ kind: 'verify' })).rejects.toMatchObject({ kind: status === 200 ? 'format' : 'http', operation: 'account.getProfileNavigationInfo', stage: 'profile', status, contentType: 'html', attempt: 1 })
  expect(network).toHaveBeenCalledTimes(2)
  expect(browser.snapshot()).toEqual(initial)
})
