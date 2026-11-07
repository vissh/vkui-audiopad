import { expect, it, vi } from 'vitest'
import { type commonTypes } from '@vk-audiopad/common'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'
import { deferred } from '../helpers/deferred'

const identity = { epoch: 'epoch-one', userId: '1' }
const token = { userId: '1', accessToken: 'old-synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null }
const initial = () => ({ userId: '1', sessionEpoch: 'epoch-one', webToken: token, deviceId: 'device', volume: 0.4, currentPlaylist: { synthetic: true } })
const fresh = (userId = '1') => new Response(JSON.stringify({ type: 'okay', data: { user_id: userId, access_token: `fresh-synthetic-${userId}`, expires: Number.MAX_SAFE_INTEGER, logout_hash: '' } }))
const refresh: commonTypes.SessionOperation = { kind: 'refresh', identity, rejectedToken: token.accessToken }

const setup = async () => {
  vi.useFakeTimers()
  const browser = createChrome(initial())
  const network = controlledFetch()
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  const { sessionClient: local } = await import('@vk-audiopad/common')
  // Separate module state models a UI context with no local owner shortcut.
  vi.resetModules()
  const { sessionClient: remote, commonTypes: types } = await import('@vk-audiopad/common')
  return { ...browser, ...network, local, remote, types }
}

it('shares one refresh between the worker and a separate UI client', async () => {
  const page = await setup()
  const background = page.local.requestSession(refresh)
  const popup = page.remote.requestSession(refresh)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  expect(page.api.runtime.sendMessage).toHaveBeenCalledOnce()
  page.requests[0].resolve(fresh())
  const results = await Promise.all([background, popup])
  expect(results[0]).toEqual(results[1])
  expect(results[0]).toMatchObject({ identity, token: { accessToken: 'fresh-synthetic-1' } })
  expect(page.snapshot()).toEqual({ ...initial(), webToken: results[0].token })
})

it('reuses a token already refreshed for a late rejection of its previous token', async () => {
  const page = await setup()
  const first = page.local.requestSession(refresh)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  page.requests[0].resolve(fresh())
  const next = await first
  expect(await page.remote.requestSession(refresh)).toEqual(next)
  expect(page.requests).toHaveLength(1)
})

it.each(['account-change', 'logout'])('supersedes an old refresh when explicit verification confirms %s', async outcome => {
  const page = await setup()
  const old = page.local.requestSession(refresh).catch((error: unknown) => error)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  const verifying = page.remote.requestSession({ kind: 'verify' })
  await vi.waitFor(() => { expect(page.requests).toHaveLength(2) })
  expect(page.requests[0].init?.signal?.aborted).toBe(true)
  expect(await old).toMatchObject({ kind: 'session-changed' })
  if (outcome === 'account-change') {
    page.requests[1].resolve(fresh('2'))
    await vi.waitFor(() => { expect(page.requests).toHaveLength(3) })
    page.requests[2].resolve(new Response('{"response":{}}'))
  } else page.requests[1].resolve(new Response('{"type":"error","error_info":"unauthorized"}'))
  const result = await verifying
  const after = page.snapshot()
  expect(result.identity.epoch).not.toBe(identity.epoch)
  expect(result.identity.userId).toBe(outcome === 'account-change' ? '2' : '')
  expect(after.volume).toBe(0.4)
  expect(after).not.toHaveProperty('currentPlaylist')
  page.requests[0].resolve(fresh())
  await vi.advanceTimersByTimeAsync(0)
  expect(page.snapshot()).toEqual(after)
})

it('lets one caller cancel without aborting another caller sharing the refresh', async () => {
  const page = await setup()
  const controller = new AbortController()
  const first = page.local.requestSession(refresh)
  const second = page.remote.requestSession(refresh, controller.signal).catch((error: unknown) => error)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  controller.abort()
  expect(await second).toMatchObject({ name: 'AbortError' })
  expect(page.requests[0].init?.signal?.aborted).toBe(false)
  page.requests[0].resolve(fresh())
  expect(await first).toMatchObject({ token: { accessToken: 'fresh-synthetic-1' } })
})

it('aborts shared work after its final caller cancels and ignores an adapter that completes late', async () => {
  const page = await setup()
  const first = new AbortController()
  const second = new AbortController()
  const a = page.local.requestSession(refresh, first.signal).catch((error: unknown) => error)
  const b = page.remote.requestSession(refresh, second.signal).catch((error: unknown) => error)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  first.abort()
  second.abort()
  await Promise.all([a, b])
  await vi.waitFor(() => { expect(page.requests[0].init?.signal?.aborted).toBe(true) })
  page.requests[0].resolve(fresh())
  await vi.advanceTimersByTimeAsync(0)
  expect(page.snapshot()).toEqual(initial())
  expect(page.api.storage.local.set).not.toHaveBeenCalled()
  const next = page.remote.requestSession(refresh)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(2) })
  page.requests[1].resolve(fresh())
  expect(await next).toMatchObject({ token: { accessToken: 'fresh-synthetic-1' } })
})

it.each([
  { operation: { kind: 'refresh' } },
  { operation: { kind: 'token', identity: { epoch: 'epoch-one', userId: 1 } } },
  { operation: { kind: 'unknown' } },
  { operation: { kind: 'verify' }, requestId: '' },
  { operation: { kind: 'verify' }, sender: { id: 'other-extension' } },
  { operation: { kind: 'verify' }, sender: { url: 'https://vk.ru/' } }
])('rejects malformed or unauthorized session input without network/storage effects: %#', async ({ operation, requestId, sender }) => {
  const page = await setup()
  const response = await page.sendMessageFrom({ target: page.types.MessageTarget.SERVICE_WORKER, type: page.types.MessageType.SESSION_REQUEST, requestId: requestId ?? 'request', operation }, { id: 'test-extension', url: page.api.runtime.getURL('index.html'), ...sender })
  expect(response).toMatchObject({ ok: false, error: { kind: 'format' } })
  expect(page.requests).toHaveLength(0)
  expect(page.snapshot()).toEqual(initial())
})

it('does not let a different document cancel a request by reusing its ID', async () => {
  const page = await setup()
  const pending = page.remote.requestSession(refresh)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  const request = page.api.runtime.sendMessage.mock.calls[0][0] as commonTypes.SessionRequestMessage
  await page.sendMessageFrom({ target: request.target, type: page.types.MessageType.SESSION_CANCEL, requestId: request.requestId }, { id: 'test-extension', url: page.api.runtime.getURL('index.html'), documentId: 'another-document' })
  expect(page.requests[0].init?.signal?.aborted).toBe(false)
  page.requests[0].resolve(fresh())
  expect(await pending).toMatchObject({ token: { accessToken: 'fresh-synthetic-1' } })
})

it('rejects an unrelated or malformed reply instead of trusting its payload', async () => {
  const page = await setup()
  page.api.runtime.sendMessage.mockResolvedValueOnce({ requestId: 'unrelated', ok: true, snapshot: { identity, token } })
  await expect(page.remote.requestSession({ kind: 'token', identity })).rejects.toMatchObject({ kind: 'format' })
})

it('bounds a missing reply and sends cancellation instead of retrying the request', async () => {
  vi.useFakeTimers()
  const page = await setup()
  page.api.runtime.sendMessage.mockImplementationOnce(async () => await new Promise(() => {}))
  const pending = expect(page.remote.requestSession({ kind: 'verify' })).rejects.toMatchObject({ name: 'TimeoutError' })
  await vi.advanceTimersByTimeAsync(15_000)
  await pending
  expect(page.api.runtime.sendMessage).toHaveBeenCalledTimes(2)
  expect(page.api.runtime.sendMessage.mock.calls[1][0]).toMatchObject({ type: page.types.MessageType.SESSION_CANCEL })
  expect(page.requests).toHaveLength(0)
  expect(vi.getTimerCount()).toBe(0)
})

it('retains the persisted session epoch and cached token across owner recreation', async () => {
  const page = await setup()
  const listener = page.api.runtime.onMessage.addListener.mock.calls[0][0]
  page.api.runtime.onMessage.removeListener(listener)
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  const { sessionClient } = await import('@vk-audiopad/common')
  expect(await sessionClient.getSessionToken()).toMatchObject({ identity, token })
  expect(page.requests).toHaveLength(0)
})

it('rejects a token request delayed across logout/relogin to the same account ID', async () => {
  const page = await setup()
  const release = deferred<void>()
  const send = page.api.runtime.sendMessage.getMockImplementation()!
  page.api.runtime.sendMessage.mockImplementationOnce(async message => {
    await release.promise
    return await send(message)
  })
  const pending = page.remote.getSessionToken().catch((error: unknown) => error)
  await vi.waitFor(() => { expect(page.api.runtime.sendMessage).toHaveBeenCalledOnce() })
  await page.api.storage.local.set({ sessionEpoch: 'new-session-same-user' })
  release.resolve()
  expect(await pending).toMatchObject({ kind: 'session-changed' })
  expect(page.requests).toHaveLength(0)
})

it('does not change accounts from a background refresh without explicit verification', async () => {
  const page = await setup()
  const pending = expect(page.remote.requestSession(refresh)).rejects.toMatchObject({ kind: 'session-changed' })
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  page.requests[0].resolve(fresh('2'))
  await pending
  expect(page.snapshot()).toEqual(initial())
})

it('preserves data when the final verification caller cancels during its profile check', async () => {
  const page = await setup()
  const controller = new AbortController()
  const pending = page.remote.requestSession({ kind: 'verify' }, controller.signal).catch((error: unknown) => error)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  page.requests[0].resolve(fresh('2'))
  await vi.waitFor(() => { expect(page.requests).toHaveLength(2) })
  controller.abort()
  expect(await pending).toMatchObject({ name: 'AbortError' })
  page.requests[1].resolve(new Response('{"response":{}}'))
  await vi.advanceTimersByTimeAsync(0)
  expect(page.snapshot()).toEqual(initial())
})

it('keeps the signed-out epoch stable across repeated confirmed-logout checks', async () => {
  const page = await setup()
  page.fetch.mockResolvedValue(new Response('{"type":"error","error_info":"unauthorized"}'))
  const first = await page.remote.requestSession({ kind: 'verify' })
  page.fetch.mockResolvedValue(new Response('{"type":"error","error_info":"unauthorized"}'))
  const second = await page.remote.requestSession({ kind: 'verify' })
  expect(second.identity).toEqual(first.identity)
  expect(second.identity.userId).toBe('')
})

it('serializes safe failures without upstream secret/error details', async () => {
  const page = await setup()
  page.fetch.mockRejectedValueOnce(new Error('synthetic-private-token'))
  const pending: unknown = await page.remote.requestSession({ kind: 'verify' }).catch((error: unknown) => error)
  expect(pending).toMatchObject({ kind: 'unavailable' })
  expect(JSON.stringify(pending)).not.toContain('synthetic-private-token')
  expect(page.snapshot()).toEqual(initial())
})

it('retains legacy cached credentials without forcing a migration network call', async () => {
  const page = await setup()
  await page.api.storage.local.remove('sessionEpoch')
  const legacy = { ...token, logoutHash: undefined }
  await page.api.storage.local.set({ webToken: legacy })
  expect(await page.remote.getSessionToken()).toMatchObject({ identity: { userId: '1', epoch: 'legacy' }, token })
  expect(page.requests).toHaveLength(0)
})

it('retires obsolete verification before serving another account from its cached token', async () => {
  const page = await setup()
  const old = page.remote.requestSession({ kind: 'verify' }).catch((error: unknown) => error)
  await vi.waitFor(() => { expect(page.requests).toHaveLength(1) })
  const next = { ...token, userId: '2', accessToken: 'account-two-synthetic' }
  await page.api.storage.local.set({ userId: '2', sessionEpoch: 'epoch-two', webToken: next })
  expect(await page.remote.getSessionToken()).toMatchObject({ identity: { userId: '2', epoch: 'epoch-two' }, token: next })
  expect(await old).toMatchObject({ kind: 'session-changed' })
  expect(page.requests[0].init?.signal?.aborted).toBe(true)
  page.requests[0].resolve(fresh())
  await vi.advanceTimersByTimeAsync(0)
  expect(page.snapshot().webToken).toEqual(next)
})
