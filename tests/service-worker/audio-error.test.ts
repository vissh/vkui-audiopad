import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'

afterEach(clearPlaybackMocks)

it('waits for a retry and cancels it when the user chooses another track', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  await player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  const { onError } = await import('../../packages/service-worker/src/actions/on-audio-error')
  const pending = onError(player.state.playbackId!)
  await player.playNewTrack('1_3', playlist(['1_3'], 'new'))
  await vi.runAllTimersAsync()
  await pending
  expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_3'])
})

it.each([false, true])('retries failed media three times per track and stops after five tracks (Mix=%s)', async mix => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  let id = 0
  player.fetchMix.mockImplementation(async () => track(`1_${++id}`))
  await player.playNewTrack(mix ? null : '1_1', { ...playlist(['1_1', '1_2', '1_3', '1_4', '1_5', '1_6']), isVkMix: mix })
  const { onError } = await import('../../packages/service-worker/src/actions/on-audio-error')
  for (let count = 0; count < 15; count++) {
    const playbackId = player.state.playbackId!
    const pending = onError(playbackId)
    await onError(playbackId)
    await vi.runAllTimersAsync()
    await pending
  }
  const sources = player.play.mock.calls.map(call => call[0])
  expect(sources).toEqual(Array.from({ length: 5 }, (_, i) => Array(3).fill(track(`1_${i + 1}`).url)).flat())
  expect(new Set(player.play.mock.calls.map(call => call[2])).size).toBe(15)
  expect(player.state).toMatchObject({ played: false, playbackRequested: false, playbackId: null })
  expect(player.state.playbackError).toContain('5 треков подряд')
  expect(player.pause).toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(60_000)
  expect(player.play).toHaveBeenCalledTimes(15)
})

it('shares same-track attempts between missing URLs, launch failures and media errors', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  player.fetchTrack.mockResolvedValueOnce(null)
  player.play.mockRejectedValueOnce(new Error('No receiver'))
  const pending = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  await vi.runAllTimersAsync()
  await pending
  expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_1', '1_1'])
  const { onError } = await import('../../packages/service-worker/src/actions/on-audio-error')
  const failed = onError(player.state.playbackId!)
  await vi.runAllTimersAsync()
  await failed
  expect(player.state.activeTrack?.id).toBe('1_2')
  expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_1', '1_1', '1_2'])
})

it('starts a fresh budget for an explicit retry after stopping', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  player.fetchTrack.mockResolvedValue(null)
  const pending = player.playNewTrack('1_1', playlist(['1_1']))
  await vi.runAllTimersAsync()
  await pending
  expect(player.state.playbackError).not.toBeNull()
  player.fetchTrack.mockResolvedValue(track('1_1'))
  const { onPlayed } = await import('../../packages/service-worker/src/actions/play-or-pause')
  await onPlayed(true)
  expect(player.state.playbackError).toBeNull()
  expect(player.play).toHaveBeenCalledOnce()
})

it('cancels a pending retry on pause and reloads failed media on explicit resume', async () => {
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
  expect(player.fetchTrack).toHaveBeenCalledTimes(2)
  expect(player.play).toHaveBeenCalledTimes(2)
  expect(player.pause.mock.calls.map(call => call[0])).toEqual([false])
})

it('resets consecutive failures only after actual playing, not source dispatch', async () => {
  vi.useFakeTimers()
  const player = await playbackHarness()
  player.fetchTrack.mockImplementation(async (_owner, id) => id === '1_1' ? null : track(id))
  const pending = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  await vi.runAllTimersAsync()
  await pending
  vi.doMock('../../packages/service-worker/src/fetchers/queue-params', () => ({ fetchQueueParams: vi.fn(async () => {}) }))
  vi.doMock('../../packages/service-worker/src/fetchers/start-playback', () => ({ fetchStartPlayback: vi.fn(async () => {}) }))
  const { onPlaying } = await import('../../packages/service-worker/src/actions/on-audio-playing')
  const { commonTypes } = await import('@vk-audiopad/common')
  await onPlaying({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.AUDIO_PLAYER_PLAYING, playbackId: player.state.playbackId!, currentTime: 0, duration: 30, volume: 1 })
  const { getPlaybackOperation } = await import('../../packages/service-worker/src/playback-operation')
  expect([...getPlaybackOperation()!.visited]).toEqual(['1_2'])
  expect(getPlaybackOperation()!.attempts).toBe(1)
  vi.doUnmock('../../packages/service-worker/src/fetchers/queue-params')
  vi.doUnmock('../../packages/service-worker/src/fetchers/start-playback')
})
