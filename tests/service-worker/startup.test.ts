// @vitest-environment jsdom
import { commonTypes } from '@vk-audiopad/common'
import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'
import { installAudio } from '../helpers/audio'
import { deferred } from '../helpers/deferred'

afterEach(clearPlaybackMocks)

const startup = async ({ offscreen = true, exists = true, paused = false, mediaId = 'media', listen = true } = {}) => {
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const queue = playlist(['1_1', '1_2'])
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: queue, audiosIds: [['1_1', ''], ['1_2', '']], playbackId: 'media', played: true, playbackRequested: true }, { realState: true })
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  player.api.runtime.getContexts.mockResolvedValue(exists ? [{ documentUrl: 'offscreen.html' }] : [])
  const audios = installAudio()
  const { replaceAudio, setAudioPlaybackRequested } = await import('../../packages/offscreen/src/audio-element')
  replaceAudio(mediaId)
  setAudioPlaybackRequested(!paused)
  const audio = audios.at(-1)!
  Object.assign(audio, { src: 'https://audio.invalid/source.mp3', currentTime: 12, duration: 30, paused })
  const { startListeningMessages: listenOffscreen } = await import('../../packages/offscreen/src/listeners/messages')
  if (listen) listenOffscreen()
  const { initializePlayback } = await import('../../packages/service-worker/src/initialize')
  const { createReadiness } = await import('../../packages/service-worker/src/readiness')
  const gate = createReadiness(async acceptMedia => { await initializePlayback(offscreen, acceptMedia) })
  const { startListeningMessages } = await import('../../packages/service-worker/src/listeners/messages')
  const { startListeningCommandEvents } = await import('../../packages/service-worker/src/listeners/command')
  await startListeningMessages(gate, offscreen)
  startListeningCommandEvents(gate)
  return { ...player, gate, audio }
}

it.each([true, false])('reconciles surviving playing media without replacing or replaying it with offscreen=%s', async offscreen => {
  const player = await startup({ offscreen })
  await player.api.storage.local.set({ playbackSelection: { id: 'unfinished-mix', ownerId: '1', blockId: '', isVkMix: true, mixId: 'common' } })
  expect(await player.gate.start()).toBe(true)
  expect(player.snapshot().playbackSelection).toBeNull()
  expect(player.snapshot()).toMatchObject({ playbackInitialization: 'ready', played: true, playbackRequested: true, playbackId: 'media', currentTime: 12, duration: 30 })
  expect(player.audio.play).not.toHaveBeenCalled()
  expect(player.fetchTrack).not.toHaveBeenCalled()
  expect(player.api.offscreen.createDocument).not.toHaveBeenCalled()
  await player.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  await vi.waitFor(() => { expect(player.pause).toHaveBeenCalledWith(false, expect.any(Function)) })
  expect(player.snapshot()).toMatchObject({ played: false, playbackRequested: false, currentTime: 12 })
})

it('restores paused media and its position instead of replaying persisted intent', async () => {
  const player = await startup({ paused: true })
  expect(await player.gate.start()).toBe(true)
  expect(player.snapshot()).toMatchObject({ played: false, playbackRequested: false, playbackId: 'media', currentTime: 12 })
  expect(player.audio.play).not.toHaveBeenCalled()
})

it('preserves an existing pending source request before HLS has attached its native src', async () => {
  const player = await startup({ paused: true })
  player.audio.src = ''
  const { setAudioPlaybackRequested } = await import('../../packages/offscreen/src/audio-element')
  setAudioPlaybackRequested(true)
  expect(await player.gate.start()).toBe(true)
  expect(player.snapshot()).toMatchObject({ played: false, playbackRequested: true, playbackId: 'media' })
  expect(player.audio.play).not.toHaveBeenCalled()
  expect(player.fetchTrack).not.toHaveBeenCalled()
})

it('clears stale media identity without autoplay or creating offscreen when the document is absent', async () => {
  const player = await startup({ exists: false })
  expect(await player.gate.start()).toBe(true)
  expect(player.snapshot()).toMatchObject({ playbackInitialization: 'ready', played: false, playbackRequested: false, playbackId: null, activeTrack: { id: '1_1' } })
  expect(player.play).not.toHaveBeenCalled()
  expect(player.api.offscreen.createDocument).not.toHaveBeenCalled()
})

it('pauses mismatched media and allows an explicit retry without adopting the wrong track', async () => {
  const player = await startup({ mediaId: 'other-media' })
  expect(await player.gate.start()).toBe(true)
  expect(player.audio.pause).toHaveBeenCalledOnce()
  expect(player.snapshot()).toMatchObject({ playbackInitialization: 'ready', played: false, playbackRequested: false, playbackId: null, playbackError: expect.any(String) })
  await player.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  await vi.waitFor(() => { expect(player.play).toHaveBeenCalledOnce() })
  expect(player.snapshot()).toMatchObject({ playbackRequested: true, playbackError: null })
})

it('registers handlers before loading and uses the restored queue for a queued hotkey', async () => {
  const player = await startup({ exists: false })
  const release = deferred<void>()
  const read = player.api.storage.local.get.getMockImplementation()!
  player.api.storage.local.get.mockImplementationOnce(async (keys, callback) => {
    await release.promise
    return await read(keys, callback)
  })
  const starting = player.gate.start()
  player.api.commands.onCommand.emit('030-next')
  expect(player.fetchTrack).not.toHaveBeenCalled()
  expect(player.gate.getStatus()).toBe('loading')
  release.resolve()
  expect(await starting).toBe(true)
  await vi.waitFor(() => { expect(player.play).toHaveBeenCalledOnce() })
  expect(player.state.activeTrack?.id).toBe('1_2')
})

it('preserves the order of toggles queued during loading without waiting for media startup', async () => {
  const player = await startup({ paused: true })
  await player.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  player.api.commands.onCommand.emit('010-play-pause')
  expect(player.pause).not.toHaveBeenCalled()
  expect(await player.gate.start()).toBe(true)
  await vi.waitFor(() => { expect(player.pause).toHaveBeenCalledWith(false, expect.any(Function)) })
  expect(player.snapshot()).toMatchObject({ playbackRequested: false, played: false })
  expect(player.pause.mock.calls.some(call => call[0] === true)).toBe(false)
})

it('publishes initialization failure and drops queued commands when storage cannot load', async () => {
  const player = await startup()
  player.api.storage.local.get.mockRejectedValueOnce(new Error('private storage detail'))
  player.api.commands.onCommand.emit('030-next')
  expect(await player.gate.start()).toBe(false)
  expect(player.gate.getStatus()).toBe('failed')
  expect(player.fetchTrack).not.toHaveBeenCalled()
  expect(player.snapshot()).toMatchObject({ playbackInitialization: 'failed', playbackError: expect.any(String) })
  expect(player.snapshot().playbackError).not.toContain('private')
})

it('discards media events older than the startup snapshot', async () => {
  const player = await startup({ paused: true })
  await player.api.runtime.sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.AUDIO_PLAYER_PLAYING,
    playbackId: 'media',
    duration: 30,
    currentTime: 1,
    volume: 0.5
  })
  expect(await player.gate.start()).toBe(true)
  expect(player.snapshot()).toMatchObject({ played: false, playbackRequested: false, currentTime: 12 })
})

it('applies media events newer than the snapshot after the final startup commit', async () => {
  const player = await startup()
  const release = deferred<void>()
  const committing = deferred<void>()
  const write = player.api.storage.local.set.getMockImplementation()!
  player.api.storage.local.set.mockImplementation(async (values, callback) => {
    if (values.playbackInitialization === 'ready') {
      committing.resolve()
      await release.promise
    }
    await write(values, callback)
  })
  const starting = player.gate.start()
  await committing.promise
  await player.api.runtime.sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.AUDIO_PLAYER_TIMEUPDATED,
    playbackId: 'media',
    duration: 30,
    currentTime: 20,
    paused: false
  })
  expect(player.gate.getStatus()).toBe('loading')
  release.resolve()
  expect(await starting).toBe(true)
  await vi.waitFor(() => { expect(player.snapshot().currentTime).toBe(20) })
})

it('fails observably when an existing offscreen document never answers', async () => {
  vi.useFakeTimers()
  const player = await startup()
  player.api.runtime.sendMessage.mockImplementation(async () => undefined)
  const starting = player.gate.start()
  await vi.runAllTimersAsync()
  expect(await starting).toBe(false)
  expect(player.snapshot()).toMatchObject({ playbackInitialization: 'failed', playbackError: expect.any(String) })
  expect(player.api.offscreen.createDocument).not.toHaveBeenCalled()
  expect(player.fetchTrack).not.toHaveBeenCalled()
})

it('waits for Firefox audio listeners when the orchestrator starts before the other module', async () => {
  vi.useFakeTimers()
  const player = await startup({ offscreen: false, listen: false, paused: true })
  const starting = player.gate.start()
  await vi.advanceTimersByTimeAsync(100)
  expect(player.gate.getStatus()).toBe('loading')
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  startListeningMessages()
  await vi.advanceTimersByTimeAsync(2000)
  expect(await starting).toBe(true)
  expect(player.snapshot()).toMatchObject({ playbackInitialization: 'ready', played: false, playbackId: 'media', currentTime: 12 })
  expect(player.audio.play).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})

it('bounds Firefox startup when audio listeners never register', async () => {
  vi.useFakeTimers()
  const player = await startup({ offscreen: false, listen: false })
  const starting = player.gate.start()
  await vi.advanceTimersByTimeAsync(2000)
  expect(await starting).toBe(false)
  expect(player.snapshot()).toMatchObject({ playbackInitialization: 'failed', playbackRequested: false })
  expect(player.audio.play).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})
