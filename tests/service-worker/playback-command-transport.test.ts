// @vitest-environment jsdom
import { commonTypes } from '@vk-audiopad/common'
import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'

afterEach(clearPlaybackMocks)

it.each([true, false])('shares toggle intent across runtime, hotkeys and background bridge with offscreen=%s', async offscreen => {
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: playlist(['1_1']), playbackId: 'media', currentTime: 12 })
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  const { startListeningMessages } = await import('../../packages/service-worker/src/listeners/messages')
  const { startListeningCommandEvents } = await import('../../packages/service-worker/src/listeners/command')
  const { commonUtils } = await import('@vk-audiopad/common')
  const { immediateReadiness } = await import('../../packages/service-worker/src/readiness')
  await startListeningMessages(immediateReadiness, offscreen)
  startListeningCommandEvents(immediateReadiness)
  const message: commonTypes.TogglePlaybackMessage = { target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK }
  await player.api.runtime.sendMessage(message)
  await vi.waitFor(() => { expect(player.snapshot()).toMatchObject({ playbackRequested: true }) })
  player.api.commands.onCommand.emit('010-play-pause')
  await vi.waitFor(() => { expect(player.snapshot()).toMatchObject({ playbackRequested: false }) })
  if (offscreen) {
    await player.api.runtime.sendMessage(message)
  } else {
    commonUtils.sendBackgroundMessage(message)
  }
  await vi.waitFor(() => { expect(player.snapshot()).toMatchObject({ playbackRequested: true }) })
  expect(player.snapshot()).toMatchObject({ played: false, currentTime: 12, playbackId: 'media' })
  expect(player.fetchTrack).not.toHaveBeenCalled()
})

it.each([true, false])('orders rapid shuffle commands through the shared writer with offscreen=%s', async offscreen => {
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const player = await playbackHarness({ shuffle: false, currentPlaylist: playlist(['1_1', '1_2']), activeTrack: track('1_1'), audiosIds: [['1_1', ''], ['1_2', '']] })
  const { deferred } = await import('../helpers/deferred')
  const gate = deferred<void>()
  const started = deferred<void>()
  const save = player.api.storage.local.set.getMockImplementation()!
  player.api.storage.local.set.mockImplementationOnce(async (values, callback) => {
    started.resolve()
    await gate.promise
    await save(values, callback)
  })
  const { startListeningMessages } = await import('../../packages/service-worker/src/listeners/messages')
  const { startListeningStorageEvents } = await import('../../packages/service-worker/src/listeners/storage')
  const { immediateReadiness } = await import('../../packages/service-worker/src/readiness')
  const { commonUtils } = await import('@vk-audiopad/common')
  await startListeningMessages(immediateReadiness, offscreen)
  startListeningStorageEvents(immediateReadiness)
  const message: commonTypes.ToggleShuffleMessage = { target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_SHUFFLE }
  for (let index = 0; index < 36; index++) {
    if (offscreen) await player.api.runtime.sendMessage(message)
    else commonUtils.sendBackgroundMessage(message)
  }
  await started.promise
  expect(player.api.storage.local.set).toHaveBeenCalledOnce()
  gate.resolve()
  await vi.waitFor(() => {
    expect(player.api.storage.local.set.mock.calls.filter(([changes]) => 'shuffle' in changes)).toHaveLength(36)
    expect(player.snapshot()).toMatchObject({ shuffle: false, originalAudiosIds: [], audiosIds: [['1_1', ''], ['1_2', '']] })
  })
  const values = player.api.storage.local.set.mock.calls.flatMap(([changes]) => 'shuffle' in changes ? [changes.shuffle] : [])
  expect(values).toEqual(Array.from({ length: 36 }, (_, index) => index % 2 === 0))
})

it('cycles every repeat command while the first storage commit is delayed', async () => {
  const player = await playbackHarness({ repeat: commonTypes.RepeatMode.NONE })
  const { repeat } = await import('../../packages/service-worker/src/actions/repeat')
  const { deferred } = await import('../helpers/deferred')
  const gate = deferred<void>()
  const save = player.api.storage.local.set.getMockImplementation()!
  player.api.storage.local.set.mockImplementationOnce(async (values, callback) => {
    await gate.promise
    await save(values, callback)
  })
  const actions = Array.from({ length: 18 }, async () => { await repeat() })
  await Promise.resolve()
  gate.resolve()
  await Promise.all(actions)
  expect(player.api.storage.local.set.mock.calls.map(([changes]) => changes.repeat)).toEqual(Array.from({ length: 18 }, (_, index) => (index + 1) % 3))
  expect(player.snapshot().repeat).toBe(commonTypes.RepeatMode.NONE)
})

it('releases the settings writer after a failed mode commit', async () => {
  const player = await playbackHarness({ shuffle: false })
  const { toggleShuffle } = await import('../../packages/service-worker/src/actions/shuffle')
  player.failNextStorageOperation('Controlled storage failure')
  await expect(toggleShuffle()).rejects.toThrow('Controlled storage failure')
  await toggleShuffle()
  expect(player.snapshot().shuffle).toBe(true)
})
