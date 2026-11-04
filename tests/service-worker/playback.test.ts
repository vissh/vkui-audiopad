import { afterEach, describe, expect, it, vi } from 'vitest'
import { deferred } from '../helpers/deferred'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'
import { type commonTypes } from '@vk-audiopad/common'

afterEach(clearPlaybackMocks)

describe('bounded playback', () => {
  it('skips unusable Mix recommendations within the shared budget', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchMix.mockResolvedValueOnce({ ...track('1_100'), url: '' })
    player.fetchMix.mockResolvedValueOnce(track('1_100'))
    player.fetchMix.mockResolvedValueOnce(track('1_101'))
    const mix = { ...playlist([], 'mix'), isVkMix: true }
    const pending = player.playNewTrack(null, mix)
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchMix).toHaveBeenCalledTimes(3)
    expect(player.play.mock.calls.map(call => call[0])).toEqual([track('1_101').url])
    expect(player.state.currentPlaylist?.tracks.map(item => item.id)).toEqual(['1_101'])
    expect(mix.tracks).toEqual([])
  })

  it('stops Mix after the shared budget even if the server repeats an unusable recommendation', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    const { MAX_PLAYBACK_ATTEMPTS } = await import('../../packages/service-worker/src/playback-operation')
    player.fetchMix.mockResolvedValue({ ...track('1_100'), url: '' })
    const pending = player.playNewTrack(null, { ...playlist([], 'mix'), isVkMix: true })
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchMix).toHaveBeenCalledTimes(MAX_PLAYBACK_ATTEMPTS)
    expect(player.play).not.toHaveBeenCalled()
    expect(player.snapshot()).toMatchObject({ played: false, playbackRequested: false, playbackError: expect.any(String) })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(player.fetchMix).toHaveBeenCalledTimes(MAX_PLAYBACK_ATTEMPTS)
  })

  it('cancels a Mix recommendation delay when another track is selected', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchMix.mockResolvedValueOnce({ ...track('1_100'), url: '' })
    const pending = player.playNewTrack(null, { ...playlist([], 'mix'), isVkMix: true })
    await vi.advanceTimersByTimeAsync(0)
    expect(player.fetchMix).toHaveBeenCalledOnce()
    await player.playNewTrack('1_2', playlist(['1_2']))
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchMix).toHaveBeenCalledOnce()
    expect(player.state.activeTrack?.id).toBe('1_2')
    expect(player.state.playbackError).toBeNull()
  })

  it.each([false, true])('stops an empty playlist with isRadio=%s without indexing an empty array', async isRadio => {
    const player = await playbackHarness()
    await expect(player.playNewTrack(null, { ...playlist([]), isRadio })).resolves.toBeUndefined()
    expect(player.fetchTrack).not.toHaveBeenCalled()
    expect(player.play).not.toHaveBeenCalled()
    expect(player.snapshot()).toMatchObject({ played: false, playbackError: expect.any(String) })
  })

  it('visits an unavailable track only once and stops without more timers or requests', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchTrack.mockImplementation(async () => {
      if (player.fetchTrack.mock.calls.length > 2) throw new Error('Test guard stops the old infinite loop')
      return null
    })
    const pending = player.playNewTrack('1_1', playlist(['1_1'])).catch(error => error)
    await vi.runAllTimersAsync()
    expect(await pending).toBeUndefined()
    expect(player.fetchTrack).toHaveBeenCalledTimes(1)
    expect(player.snapshot()).toMatchObject({ played: false, playbackError: expect.any(String) })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(player.fetchTrack).toHaveBeenCalledTimes(1)
  })

  it('skips unavailable candidates and starts the first working track', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchTrack.mockResolvedValueOnce(null)
    const pending = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_2'])
    expect(player.state.activeTrack?.id).toBe('1_2')
    expect(player.play).toHaveBeenCalledOnce()
  })

  it('skips duplicate ids without hiding an unvisited working track', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchTrack.mockResolvedValueOnce(null)
    const pending = player.playNewTrack('1_1', playlist(['1_1', '1_1', '1_2']))
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_2'])
    expect(player.state.activeTrack?.id).toBe('1_2')
  })

  it('cancels the old retry delay when a new command arrives', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchTrack.mockResolvedValueOnce(null)
    const old = player.playNewTrack('1_1', playlist(['1_1', '1_2'], 'old')).catch(error => error)
    await vi.advanceTimersByTimeAsync(0)
    await player.playNewTrack('1_3', playlist(['1_3'], 'new'))
    await vi.runAllTimersAsync()
    await old
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_3'])
    expect(player.state.activeTrack?.id).toBe('1_3')
  })

  it('stops at the safety budget in a large playlist', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    const { MAX_PLAYBACK_ATTEMPTS } = await import('../../packages/service-worker/src/playback-operation')
    player.fetchTrack.mockResolvedValue(null)
    const ids = Array.from({ length: MAX_PLAYBACK_ATTEMPTS * 2 }, (_, index) => `1_${index}`)
    const pending = player.playNewTrack(ids[0], playlist(ids))
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchTrack.mock.calls.length).toBeLessThanOrEqual(MAX_PLAYBACK_ATTEMPTS)
    expect(player.fetchTrack.mock.calls.length).toBeGreaterThan(0)
    expect(new Set(player.fetchTrack.mock.calls.map(call => call[1])).size).toBe(player.fetchTrack.mock.calls.length)
    expect(player.state.played).toBe(false)
    expect(player.state.playbackError).not.toBeNull()
  })

  it('reports a current network failure without automatically retrying the request', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchTrack.mockRejectedValueOnce(new Error('Offline'))
    await expect(player.playNewTrack('1_1', playlist(['1_1']))).resolves.toBeUndefined()
    await vi.runAllTimersAsync()
    expect(player.fetchTrack).toHaveBeenCalledOnce()
    expect(player.state.playbackError).not.toBeNull()
  })

  it.each(['classified', 'unknown'])('logs a safe category for a %s failure without raw causes or response data', async kind => {
    const player = await playbackHarness()
    const { vkApiClient } = await import('@vk-audiopad/common')
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const secret = 'access_token=synthetic-private-value'
    const error = kind === 'classified' ? new vkApiClient.VKApiError('network') : new Error(secret, { cause: secret })
    Object.assign(error, { privatePayload: secret })
    player.fetchMix.mockRejectedValueOnce(error)
    await player.playNewTrack(null, { ...playlist([], 'mix'), isVkMix: true })
    expect(player.fetchMix).toHaveBeenCalledOnce()
    expect(warning.mock.calls).toEqual([['Playback preparation failed', kind === 'classified' ? 'network' : 'unavailable']])
    expect(JSON.stringify(player.snapshot())).not.toContain(secret)
  })
})

describe('latest playback command', () => {
  it('ignores a late response even when the request adapter ignores cancellation', async () => {
    const player = await playbackHarness()
    const response = deferred<commonTypes.TrackItem | null>()
    player.fetchTrack.mockReturnValueOnce(response.promise)
    const old = player.playNewTrack('1_1', playlist(['1_1'], 'old'))
    await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
    await player.playNewTrack('1_2', playlist(['1_2'], 'new'))
    response.resolve(track('1_1'))
    await old
    expect(player.state.activeTrack?.id).toBe('1_2')
    expect(player.play.mock.calls.map(call => call[0])).toEqual([track('1_2').url])
  })

  it('ignores a late failure of a superseded command', async () => {
    const player = await playbackHarness()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const response = deferred<commonTypes.TrackItem | null>()
    player.fetchTrack.mockReturnValueOnce(response.promise)
    const old = player.playNewTrack('1_1', playlist(['1_1'], 'old')).catch(error => error)
    await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
    await player.playNewTrack('1_2', playlist(['1_2'], 'new'))
    response.reject(new Error('Old network failure'))
    expect(await old).toBeUndefined()
    expect(player.snapshot()).toMatchObject({ activeTrack: { id: '1_2' }, playbackError: null })
    expect(warning).not.toHaveBeenCalled()
  })

  it('rejects late queue hydration from a previous playlist', async () => {
    const player = await playbackHarness()
    const response = deferred<commonTypes.AudioTuple[]>()
    player.fetchQueue.mockReturnValueOnce(response.promise)
    const old = player.playNewTrack('1_1', playlist(['1_1'], 'old'))
    await vi.waitFor(() => { expect(player.fetchQueue).toHaveBeenCalledOnce() })
    await player.playNewTrack('1_2', playlist(['1_2'], 'new'))
    response.resolve([['1_8', '']])
    await old
    expect(player.snapshot()).toMatchObject({ currentPlaylist: { id: 'new' }, audiosIds: [['1_2', '']] })
  })

  it('counts rapid next/previous commands from the pending selection', async () => {
    const value = playlist(['1_1', '1_2', '1_3'])
    const player = await playbackHarness({ currentPlaylist: value, activeTrack: track('1_1'), activeTrackIndex: 0, audiosIds: value.tracks.map(item => [item.id, '']) })
    const response = deferred<commonTypes.TrackItem | null>()
    player.fetchTrack.mockReturnValueOnce(response.promise)
    const first = player.nextTrack()
    await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
    await player.nextTrack()
    await player.previousTrack()
    response.resolve(track('1_2'))
    await first
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_2', '1_3', '1_2'])
    expect(player.state.activeTrack?.id).toBe('1_2')
  })

  it('does not mutate the caller playlist when a delayed Mix request is superseded', async () => {
    const player = await playbackHarness()
    const response = deferred<commonTypes.TrackItem>()
    player.fetchMix.mockReturnValueOnce(response.promise)
    const mix = { ...playlist([], 'mix'), isVkMix: true }
    const old = player.playNewTrack(null, mix)
    await player.playNewTrack('1_2', playlist(['1_2'], 'new'))
    response.resolve(track('1_100'))
    await old
    expect(mix.tracks).toEqual([])
    expect(player.state.activeTrack?.id).toBe('1_2')
  })

  it('serializes a delayed storage commit before a newer command can commit', async () => {
    const player = await playbackHarness()
    const release = deferred<void>()
    const write = player.api.storage.local.set.getMockImplementation()!
    player.api.storage.local.set.mockImplementationOnce(async (values, callback) => {
      await release.promise
      await write(values, callback)
    })
    const old = player.playNewTrack('1_1', playlist(['1_1'], 'old'))
    await vi.waitFor(() => { expect(player.api.storage.local.set).toHaveBeenCalledOnce() })
    const next = player.playNewTrack('1_2', playlist(['1_2'], 'new'))
    release.resolve()
    await Promise.all([old, next])
    expect(player.snapshot()).toMatchObject({ activeTrack: { id: '1_2' }, currentPlaylist: { id: 'new' } })
    expect(player.play.mock.calls.map(call => call[0])).toEqual([track('1_2').url])
  })

  it('uses edits to the committed queue after playback has started', async () => {
    const player = await playbackHarness()
    await player.playNewTrack('1_1', playlist(['1_1', '1_2', '1_3']))
    await player.api.storage.local.set({ audiosIds: [['1_1', ''], ['1_3', '']] })
    await player.nextTrack()
    expect(player.state.activeTrack?.id).toBe('1_3')
  })

  it('finishes queue hydration for the new track when skipping within the same playlist', async () => {
    const player = await playbackHarness()
    const response = deferred<commonTypes.AudioTuple[]>()
    player.fetchQueue.mockReturnValueOnce(response.promise).mockResolvedValueOnce([['1_1', ''], ['1_2', ''], ['1_3', '']])
    const first = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
    await vi.waitFor(() => { expect(player.fetchQueue).toHaveBeenCalledOnce() })
    await player.nextTrack()
    response.resolve([['1_99', '']])
    await first
    expect(player.snapshot()).toMatchObject({ activeTrack: { id: '1_2' }, activeTrackIndex: 1, audiosIds: [['1_1', ''], ['1_2', ''], ['1_3', '']] })
  })

  it('ignores stale media events and delayed ended handlers', async () => {
    const player = await playbackHarness()
    await player.playNewTrack('1_1', playlist(['1_1', '1_3'], 'old'))
    const oldId = player.state.playbackId!
    const { onEnded } = await import('../../packages/service-worker/src/actions/on-audio-ended')
    const release = deferred<void>()
    const read = player.api.storage.local.get.getMockImplementation()!
    player.api.storage.local.get.mockImplementationOnce(async (keys, callback) => {
      await release.promise
      return await read(keys, callback)
    })
    const ended = onEnded(oldId)
    await vi.waitFor(() => { expect(player.api.storage.local.get).toHaveBeenCalledOnce() })
    await player.playNewTrack('1_2', playlist(['1_2'], 'new'))
    release.resolve()
    await ended
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
    const { startListeningMessages } = await import('../../packages/service-worker/src/listeners/messages')
    const { commonTypes } = await import('@vk-audiopad/common')
    const { immediateReadiness } = await import('../../packages/service-worker/src/readiness')
    await startListeningMessages(immediateReadiness, true)
    for (const type of [commonTypes.MessageType.AUDIO_PLAYER_ENDED, commonTypes.MessageType.AUDIO_PLAYER_ERROR, commonTypes.MessageType.AUDIO_PLAYER_PAUSE, commonTypes.MessageType.AUDIO_PLAYER_PLAYING, commonTypes.MessageType.AUDIO_PLAYER_TIMEUPDATED]) {
      await player.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type, playbackId: oldId, currentTime: 29, duration: 99 })
    }
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_2'])
    expect(player.state).toMatchObject({ activeTrack: { id: '1_2' }, currentTime: 0, playbackError: null })
  })
})
