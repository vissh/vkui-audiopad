import { afterEach, expect, it, vi } from 'vitest'
import { type commonTypes } from '@vk-audiopad/common'
import { deferred } from '../helpers/deferred'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'

afterEach(clearPlaybackMocks)

it('cancels play with a second toggle before the first media event', async () => {
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: playlist(['1_1']) })
  const response = deferred<commonTypes.TrackItem | null>()
  player.fetchTrack.mockReturnValueOnce(response.promise)
  const { togglePlayback } = await import('../../packages/service-worker/src/actions/play-or-pause')
  const playing = togglePlayback()
  await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
  expect(player.snapshot()).toMatchObject({ playbackRequested: true, played: false })
  await togglePlayback()
  response.resolve(track('1_1'))
  await playing
  expect(player.play).not.toHaveBeenCalled()
  expect(player.pause.mock.calls.map(call => call[0])).toEqual([false])
  expect(player.snapshot()).toMatchObject({ playbackRequested: false, played: false, playbackError: null })
})

it('handles two toggles in the same turn before storage publishes either intent', async () => {
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: playlist(['1_1']) })
  const { togglePlayback } = await import('../../packages/service-worker/src/actions/play-or-pause')
  await Promise.all([togglePlayback(), togglePlayback()])
  expect(player.play).not.toHaveBeenCalled()
  expect(player.fetchTrack).not.toHaveBeenCalled()
  expect(player.snapshot()).toMatchObject({ playbackRequested: false, played: false })
})

it('restarts the cancelled selection on a third toggle instead of restoring the previous track', async () => {
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: playlist(['1_1']), playbackId: 'old-media' })
  const response = deferred<commonTypes.TrackItem | null>()
  player.fetchTrack.mockReturnValueOnce(response.promise)
  const first = player.playNewTrack('1_2', playlist(['1_2'], 'new'))
  await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
  const { togglePlayback } = await import('../../packages/service-worker/src/actions/play-or-pause')
  await togglePlayback()
  await togglePlayback()
  response.resolve(track('1_2'))
  await first
  expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_2', '1_2'])
  expect(player.play.mock.calls.map(call => call[0])).toEqual([track('1_2').url])
  expect(player.snapshot()).toMatchObject({ activeTrack: { id: '1_2' }, playbackRequested: true, playbackError: null })
})

it('resumes launched media without replacing its source, position or playback id', async () => {
  const player = await playbackHarness()
  await player.playNewTrack('1_1', playlist(['1_1']))
  await player.api.storage.local.set({ currentTime: 12 })
  const playbackId = player.state.playbackId
  const { togglePlayback } = await import('../../packages/service-worker/src/actions/play-or-pause')
  await togglePlayback()
  await togglePlayback()
  expect(player.fetchTrack).toHaveBeenCalledOnce()
  expect(player.play).toHaveBeenCalledOnce()
  expect(player.pause.mock.calls.map(call => call[0])).toEqual([false, true])
  expect(player.snapshot()).toMatchObject({ playbackId, currentTime: 12, playbackRequested: true, played: false })
})

it('keeps the latest intent when an older storage write and its event finish late', async () => {
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: playlist(['1_1']), playbackId: 'media', played: false })
  const release = deferred<void>()
  const write = player.api.storage.local.set.getMockImplementation()!
  player.api.storage.local.set.mockImplementationOnce(async (values, callback) => {
    await release.promise
    await write(values, callback)
  })
  const { togglePlayback } = await import('../../packages/service-worker/src/actions/play-or-pause')
  const first = togglePlayback()
  await vi.waitFor(() => { expect(player.api.storage.local.set).toHaveBeenCalledOnce() })
  const second = togglePlayback()
  release.resolve()
  await Promise.all([first, second])
  expect(player.pause.mock.calls.map(call => call[0])).toEqual([false])
  expect(player.snapshot()).toMatchObject({ playbackRequested: false, played: false })
})

it('stops retrying unavailable sources when toggled off during the retry delay', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  player.fetchTrack.mockResolvedValue(null)
  const loading = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  await vi.advanceTimersByTimeAsync(0)
  expect(player.fetchTrack).toHaveBeenCalledOnce()
  const { togglePlayback } = await import('../../packages/service-worker/src/actions/play-or-pause')
  await togglePlayback()
  await vi.runAllTimersAsync()
  await loading
  expect(player.fetchTrack).toHaveBeenCalledOnce()
  expect(player.snapshot()).toMatchObject({ playbackRequested: false, played: false, playbackError: null })
})

it('clears requested playback after terminal failure and retries on the next toggle', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  player.fetchTrack.mockResolvedValue(null)
  const pending = player.playNewTrack('1_1', playlist(['1_1']))
  await vi.runAllTimersAsync()
  await pending
  player.fetchTrack.mockResolvedValue(track('1_1'))
  expect(player.snapshot()).toMatchObject({ playbackRequested: false, played: false, playbackError: expect.any(String) })
  const { togglePlayback } = await import('../../packages/service-worker/src/actions/play-or-pause')
  await togglePlayback()
  expect(player.play).toHaveBeenCalledOnce()
  expect(player.snapshot()).toMatchObject({ playbackRequested: true, playbackError: null })
})

it('does not leave an empty player requesting playback', async () => {
  const player = await playbackHarness()
  const { togglePlayback } = await import('../../packages/service-worker/src/actions/play-or-pause')
  await togglePlayback()
  expect(player.fetchTrack).not.toHaveBeenCalled()
  expect(player.pause).not.toHaveBeenCalled()
  expect(player.snapshot()).toMatchObject({ playbackRequested: false, played: false })
})
