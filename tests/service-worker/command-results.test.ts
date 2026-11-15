// @vitest-environment jsdom
import { commonTypes } from '@vk-audiopad/common'
import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'
import { deferred } from '../helpers/deferred'

afterEach(clearPlaybackMocks)

const setup = async (background = false) => {
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const player = await playbackHarness({ userId: '1', sessionEpoch: 'one', currentPlaylist: playlist(['1_1']), audiosIds: [['1_1', '']], activeTrack: track('1_1'), activeTrackIndex: 0 })
  const { startListeningMessages } = await import('../../packages/service-worker/src/listeners/messages')
  const { createReadiness } = await import('../../packages/service-worker/src/readiness')
  const { commandClient } = await import('@vk-audiopad/common')
  const loaded = deferred<void>()
  const gate = createReadiness(async () => { await loaded.promise })
  await startListeningMessages(gate, !background)
  const starting = gate.start()
  return { ...player, loaded, gate, starting, commandClient }
}

it.each([false, true])('waits for readiness and applied state through background=%s', async background => {
  const page = await setup(background)
  let settled = false
  const result = page.commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.ADD_TO_QUEUE, track: track('1_2') }, background).then(reply => { settled = true; return reply })
  await page.api.storage.local.get()
  expect(settled).toBe(false)
  expect(page.snapshot().audiosIds).toEqual([['1_1', '']])
  page.loaded.resolve()
  expect(await result).toMatchObject({ ok: true, outcome: 'applied' })
  expect(page.snapshot().audiosIds).toEqual([['1_1', ''], ['1_2', '']])
})

it.each([false, true])('preserves upstream shuffle commands and their results through background=%s', async background => {
  const page = await setup(background)
  page.loaded.resolve()
  const replies = await Promise.all(Array.from({ length: 2 }, async () => await page.commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_SHUFFLE }, background)))
  expect(replies).toEqual([expect.objectContaining({ ok: true, outcome: 'handled' }), expect.objectContaining({ ok: true, outcome: 'handled' })])
  expect(page.snapshot().shuffle).toBe(false)
  expect(page.api.storage.local.set.mock.calls.flatMap(([changes]) => 'shuffle' in changes ? [changes.shuffle] : [])).toEqual([true, false])
})

it('rejects malformed input and foreign senders without effects', async () => {
  const page = await setup()
  page.loaded.resolve()
  await page.starting
  const message = { target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.ADD_TO_QUEUE, track: null, requestId: 'bad', expiresAt: Date.now() + 1000 }
  expect(await page.api.runtime.sendMessage(message)).toMatchObject({ ok: false })
  await page.sendMessageFrom({ ...message, track: track('1_2') }, { id: 'other', url: 'https://example.invalid' })
  expect(page.snapshot().audiosIds).toEqual([['1_1', '']])
})

it('reports ignored stale edits and safe write failures', async () => {
  const page = await setup()
  page.loaded.resolve()
  await page.starting
  expect(await page.commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.APPEND_CURRENT_PLAYLIST, basePlaylist: playlist(['1_1'], 'stale'), playlist: playlist(['1_2']) })).toMatchObject({ ok: true, outcome: 'ignored' })
  page.api.storage.local.set.mockRejectedValueOnce(new Error('private upstream details'))
  const result = await page.commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT })
  expect(result).toMatchObject({ ok: false })
  expect(JSON.stringify(result)).not.toContain('private upstream')
  expect(page.snapshot().repeat).toBe(0)
})

it.each(['timeout', 'session'])('does not apply a queued command after %s retirement', async retirement => {
  vi.useFakeTimers()
  const page = await setup()
  const result = page.commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT })
  await page.api.storage.local.get()
  if (retirement === 'timeout') await vi.advanceTimersByTimeAsync(30_001)
  else await page.api.storage.local.set({ sessionEpoch: 'two' })
  page.loaded.resolve()
  expect(await result).toMatchObject({ ok: false })
  await page.starting
  await vi.advanceTimersByTimeAsync(0)
  expect(page.snapshot().repeat).toBe(0)
})

it('returns failure when initialization fails or a receiver is missing, without replay', async () => {
  const page = await setup()
  const result = page.commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT })
  page.loaded.reject(new Error('private startup error'))
  expect(await result).toMatchObject({ ok: false })
  page.api.runtime.sendMessage.mockRejectedValueOnce(new Error('No receiver'))
  const before = page.api.runtime.sendMessage.mock.calls.length
  expect(await page.commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT })).toMatchObject({ ok: false })
  expect(page.api.runtime.sendMessage).toHaveBeenCalledTimes(before + 1)
})

it('handles a storage read failure while waiting for readiness without an unhandled rejection', async () => {
  const page = await setup()
  page.failNextStorageOperation('Private storage error')
  const result = page.commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT })
  await Promise.resolve()
  await Promise.resolve()
  page.loaded.resolve()
  expect(await result).toMatchObject({ ok: false })
  expect(page.snapshot().repeat).toBe(0)
})

it('finishes a command safely if the initiating popup closes before its reply', async () => {
  const page = await setup()
  const receive = page.api.runtime.onMessage.addListener.mock.calls.at(-1)![0]
  const closed = vi.fn(() => { throw new Error('Message port closed') })
  expect(receive({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT, requestId: 'closed-popup', expiresAt: Date.now() + 1000 }, { id: page.api.runtime.id, url: page.api.runtime.getURL('index.html') }, closed)).toBe(true)
  page.loaded.resolve()
  await vi.waitFor(() => { expect(closed).toHaveBeenCalledOnce() })
  expect(page.snapshot().repeat).toBe(1)
})
