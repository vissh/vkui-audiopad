// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { commonTypes } from '@vk-audiopad/common'
import { createChrome } from '../helpers/chrome'
import { track } from '../helpers/playback'

const tokenSession = async () => {
  createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
}

it('removes each pending deleted track from the queue once when leaving the page', async () => {
  vi.stubGlobal('scrollTo', vi.fn())
  const browser = createChrome()
  browser.api.runtime.onMessage.addListener(() => {})
  const { deletedTrackForRestore } = await import('@/features/restore')
  const { setActiveTab } = await import('@/shared/model')
  const item = track('1_1')
  deletedTrackForRestore.add(item)
  setActiveTab({ tab: commonTypes.ContentTab.GENERAL })
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledExactlyOnceWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.DELETE_TRACK, track: item })
  deletedTrackForRestore.clear()
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

it('keeps a successfully restored track in the queue when leaving the page', async () => {
  vi.stubGlobal('scrollTo', vi.fn())
  const browser = createChrome()
  const { deletedTrackForRestore } = await import('@/features/restore')
  const item = track('1_1')
  deletedTrackForRestore.add(item)
  await deletedTrackForRestore.restore(item, async () => {})
  deletedTrackForRestore.clear()
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
})

it('uses the shared VK application ID and rejects VK deletion errors', async () => {
  await tokenSession()
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{"error":{"error_code":15,"error_msg":"synthetic-private-detail"}}'))
  vi.stubGlobal('fetch', network)
  const { vkApiDelete } = await import('../../packages/front/src/features/delete-from-my-music/api/delete')
  await expect(vkApiDelete({ ...track('1_2'), fromAct: false })).rejects.toThrow()
  expect(new URL(String(network.mock.calls[0]?.[0])).searchParams.get('client_id')).toBe('6287487')
})

it('finishes a deletion arriving after its original page has closed', async () => {
  vi.stubGlobal('scrollTo', vi.fn())
  const browser = createChrome()
  browser.api.runtime.onMessage.addListener(() => {})
  const { deletedTrackForRestore: pending } = await import('@/features/restore')
  const window = pending.window()
  pending.clear()
  pending.add(track('1_1'), window)
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
  pending.clear()
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

it.each([true, false])('defers queue removal during restoration; restore succeeds: %s', async success => {
  vi.stubGlobal('scrollTo', vi.fn())
  const browser = createChrome()
  browser.api.runtime.onMessage.addListener(() => {})
  const { deferred } = await import('../helpers/deferred')
  const { deletedTrackForRestore: pending } = await import('@/features/restore')
  const response = deferred<void>()
  const item = track('1_1')
  pending.add(item)
  const restoration = pending.restore(item, async () => { await response.promise })
  const checked = success ? expect(restoration).resolves.toBeUndefined() : expect(restoration).rejects.toThrow('Failed')
  pending.clear()
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
  if (success) response.resolve()
  else response.reject(new Error('Failed'))
  await checked
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledTimes(success ? 0 : 1)
  pending.clear()
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledTimes(success ? 0 : 1)
})

it.each([1, { audio_ids: ['1_2'] }])('accepts confirmed token deletion shapes: %j', async response => {
  await tokenSession()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ response }))))
  const { vkApiDelete } = await import('../../packages/front/src/features/delete-from-my-music/api/delete')
  await expect(vkApiDelete({ ...track('1_2'), fromAct: false })).resolves.toBeUndefined()
})

it.each([{}, { audio_ids: ['1_3'] }, 0])('rejects unconfirmed token deletion: %j', async response => {
  await tokenSession()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ response }))))
  const { vkApiDelete } = await import('../../packages/front/src/features/delete-from-my-music/api/delete')
  await expect(vkApiDelete({ ...track('1_2'), fromAct: false })).rejects.toThrow('VK audio deletion failed')
})

it('restores token-source tracks through audio.restore and validates their identity', async () => {
  await tokenSession()
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{"response":{"id":2,"owner_id":1}}'))
  vi.stubGlobal('fetch', network)
  const { vkApiRestore } = await import('../../packages/front/src/features/restore/api/restore')
  await vkApiRestore({ ...track('1_2'), fromAct: false })
  expect(String(network.mock.calls[0][0])).toContain('/audio.restore?')
  const body = network.mock.calls[0][1]?.body as URLSearchParams
  expect(body.get('owner_id')).toBe('1')
  expect(body.get('audio_id')).toBe('2')
  network.mockResolvedValueOnce(new Response('{"response":{"id":3,"owner_id":1}}'))
  await expect(vkApiRestore({ ...track('1_2'), fromAct: false })).rejects.toThrow('VK audio restoration failed')
})

it.each(['not json', '{"payload":["3",[]]}', '{"payload":[1,[]]}'])('never retries an ambiguous legacy delete automatically: %s', async body => {
  createChrome()
  const network = vi.fn(async () => new Response(body))
  vi.stubGlobal('fetch', network)
  const { vkApiDelete } = await import('../../packages/front/src/features/delete-from-my-music/api/delete')
  await expect(vkApiDelete(track('1_2'))).rejects.toThrow()
  expect(network).toHaveBeenCalledOnce()
})

it.each([429, 503])('does not accept or repeat an HTTP %s legacy mutation', async status => {
  createChrome()
  const network = vi.fn(async () => new Response('{"payload":[0,[]]}', { status }))
  vi.stubGlobal('fetch', network)
  const { vkApiDelete } = await import('../../packages/front/src/features/delete-from-my-music/api/delete')
  await expect(vkApiDelete(track('1_2'))).rejects.toThrow()
  expect(network).toHaveBeenCalledOnce()
})
