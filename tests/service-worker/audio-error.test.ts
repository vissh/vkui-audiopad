import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'

afterEach(clearPlaybackMocks)

it('waits for a retry and cancels it when the user chooses another track', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  await player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  const { onError } = await import('../../packages/service-worker/src/actions/on-audio-error')
  const pending = onError(player.state.playbackId!)
  expect(player.fetchTrack).toHaveBeenCalledTimes(1)
  await player.playNewTrack('1_3', playlist(['1_3'], 'new'))
  await vi.runAllTimersAsync()
  await pending
  expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_3'])
})

it('shares the budget for missing tracks and media failures and ignores duplicate errors', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  player.fetchTrack.mockResolvedValueOnce(null)
  const loading = player.playNewTrack('1_1', playlist(['1_1', '1_2', '1_3']))
  await vi.runAllTimersAsync()
  await loading
  expect(player.state.activeTrack?.id).toBe('1_2')
  const { onError } = await import('../../packages/service-worker/src/actions/on-audio-error')
  const id = player.state.playbackId!
  const failed = onError(id)
  await onError(id)
  await vi.runAllTimersAsync()
  await failed
  expect(player.state.activeTrack?.id).toBe('1_3')
  const last = onError(player.state.playbackId!)
  await vi.runAllTimersAsync()
  await last
  expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_2', '1_3'])
  expect(player.snapshot()).toMatchObject({ played: false, playbackError: expect.any(String), playbackId: null })
  expect(player.pause).toHaveBeenCalled()
})

it('starts a fresh budget for an explicit retry after stopping', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  player.fetchTrack.mockResolvedValueOnce(null)
  await player.playNewTrack('1_1', playlist(['1_1']))
  expect(player.state.playbackError).not.toBeNull()
  player.fetchTrack.mockResolvedValueOnce(track('1_1'))
  await player.playNewTrack('1_1', playlist(['1_1']))
  expect(player.state.playbackError).toBeNull()
  expect(player.play).toHaveBeenCalledOnce()
})

it('cancels a pending media retry on pause and resumes the current media without refetching', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  await player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  const { onError } = await import('../../packages/service-worker/src/actions/on-audio-error')
  const { onPlayed } = await import('../../packages/service-worker/src/actions/play-or-pause')
  const pending = onError(player.state.playbackId!)
  await onPlayed(false)
  await vi.runAllTimersAsync()
  await pending
  expect(player.fetchTrack).toHaveBeenCalledOnce()
  await onPlayed(true)
  expect(player.fetchTrack).toHaveBeenCalledOnce()
  expect(player.pause.mock.calls.map(call => call[0])).toEqual([false, true])
})

it('bounds automatic Mix transitions even when every response has a different track id', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  const { MAX_PLAYBACK_ATTEMPTS } = await import('../../packages/service-worker/src/playback-operation')
  let id = 0
  player.fetchMix.mockImplementation(async () => track(`1_${++id}`))
  await player.playNewTrack(null, { ...playlist([], 'mix'), isVkMix: true })
  const { onError } = await import('../../packages/service-worker/src/actions/on-audio-error')
  for (let count = 0; count < MAX_PLAYBACK_ATTEMPTS; count++) {
    const pending = onError(player.state.playbackId!)
    await vi.runAllTimersAsync()
    await pending
  }
  expect(player.fetchMix.mock.calls.length).toBeLessThanOrEqual(MAX_PLAYBACK_ATTEMPTS)
  expect(player.state).toMatchObject({ played: false, playbackId: null, playbackError: expect.any(String) })
})
