import { afterEach, describe, expect, it, vi } from 'vitest'
import { deferred } from '../helpers/deferred'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'
import { type commonTypes } from '@vk-audiopad/common'

afterEach(clearPlaybackMocks)

describe('bounded playback', () => {
  it('does not retry a storage failure without consuming an attempt', async () => {
    const player = await playbackHarness()
    player.api.storage.local.set.mockRejectedValueOnce(new Error('Storage unavailable'))
    await player.playNewTrack('1_1', playlist(['1_1']))
    expect(player.fetchTrack).not.toHaveBeenCalled()
    expect(player.state.playbackRequested).toBe(false)
    expect(player.state.playbackError).not.toBeNull()
  })

  it.each(['session-changed', 'unauthorized'] as const)('does not replay a %s Mix request across an invalid session', async kind => {
    const player = await playbackHarness()
    const { vkApiClient } = await import('@vk-audiopad/common')
    player.fetchMix.mockRejectedValueOnce(new vkApiClient.VKApiError(kind))
    await player.playNewTrack(null, { ...playlist([], 'mix'), isVkMix: true })
    expect(player.fetchMix).toHaveBeenCalledOnce()
    expect(player.state.playbackRequested).toBe(false)
  })

  it('recovers the same track after a transient request failure without skipping it', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchTrack.mockRejectedValueOnce(new Error('Offline'))
    const pending = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
    await vi.advanceTimersByTimeAsync(499)
    expect(player.fetchTrack).toHaveBeenCalledOnce()
    expect(player.state.playbackError).toBeNull()
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_1'])
    expect(player.state.activeTrack?.id).toBe('1_1')
    expect(player.play).toHaveBeenCalledOnce()
  })

  it.each(['missing', 'empty-url', 'network', 'launch'] as const)('stops after three attempts on each of five tracks for %s failures', async failure => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    if (failure === 'missing') player.fetchTrack.mockResolvedValue(null)
    if (failure === 'empty-url') player.fetchTrack.mockImplementation(async (_owner, id) => ({ ...track(id), url: '' }))
    if (failure === 'network') player.fetchTrack.mockRejectedValue(new Error('Offline'))
    if (failure === 'launch') player.play.mockRejectedValue(new Error('No receiver'))
    const pending = player.playNewTrack('1_1', playlist(['1_1', '1_2', '1_3', '1_4', '1_5', '1_6']))
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual([
      '1_1', '1_1', '1_1', '1_2', '1_2', '1_2', '1_3', '1_3', '1_3',
      '1_4', '1_4', '1_4', '1_5', '1_5', '1_5'
    ])
    expect(player.snapshot()).toMatchObject({ played: false, playbackRequested: false, playbackId: null })
    expect(player.state.playbackError).toContain('5 треков подряд')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(player.fetchTrack).toHaveBeenCalledTimes(15)
  })

  it('stops a short queue after its unique ids are exhausted, without wrapping or inventing five failures', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchTrack.mockResolvedValue(null)
    const pending = player.playNewTrack('1_1', playlist(['1_1', '1_1', '1_2']))
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_1', '1_1', '1_2', '1_2', '1_2'])
    expect(player.state.playbackError).toContain('Доступные треки')
  })

  it('advances only after the same track exhausts its attempts', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchTrack.mockImplementation(async (_owner, id) => id === '1_1' ? null : track(id))
    const pending = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchTrack.mock.calls.map(call => call[1])).toEqual(['1_1', '1_1', '1_1', '1_2'])
    expect(player.state.activeTrack?.id).toBe('1_2')
    expect(player.state.playbackError).toBeNull()
  })

  it('bounds repeated unusable Mix recommendations including same-track retries', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchMix.mockResolvedValue({ ...track('1_100'), url: '' })
    player.fetchTrack.mockResolvedValue(null)
    const pending = player.playNewTrack(null, { ...playlist([], 'mix'), isVkMix: true })
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchMix.mock.calls.length + player.fetchTrack.mock.calls.length).toBe(15)
    expect(player.play).not.toHaveBeenCalled()
    expect(player.state).toMatchObject({ playbackRequested: false, playbackId: null, playbackError: expect.any(String) })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(player.fetchMix.mock.calls.length + player.fetchTrack.mock.calls.length).toBe(15)
  })

  it('cancels a Mix recommendation delay when another track is selected', async () => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    player.fetchMix.mockRejectedValueOnce(new Error('Offline'))
    const pending = player.playNewTrack(null, { ...playlist([], 'mix'), isVkMix: true })
    await vi.advanceTimersByTimeAsync(0)
    await player.playNewTrack('1_2', playlist(['1_2']))
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchMix).toHaveBeenCalledOnce()
    expect(player.state.activeTrack?.id).toBe('1_2')
  })

  it.each([false, true])('stops an empty playlist with isRadio=%s without indexing an empty array', async isRadio => {
    const player = await playbackHarness()
    await player.playNewTrack(null, { ...playlist([]), isRadio })
    expect(player.fetchTrack).not.toHaveBeenCalled()
    expect(player.play).not.toHaveBeenCalled()
    expect(player.state.playbackError).not.toBeNull()
  })

  it.each(['classified', 'unknown'])('logs a safe category for a %s failure without raw causes or response data', async kind => {
    vi.useFakeTimers()
    const player = await playbackHarness()
    const { vkApiClient } = await import('@vk-audiopad/common')
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const secret = 'access_token=synthetic-private-value'
    const error = kind === 'classified' ? new vkApiClient.VKApiError('network') : new Error(secret, { cause: secret })
    Object.assign(error, { privatePayload: secret })
    player.fetchMix.mockRejectedValueOnce(error)
    const pending = player.playNewTrack(null, { ...playlist([], 'mix'), isVkMix: true })
    await vi.runAllTimersAsync()
    await pending
    expect(player.fetchMix).toHaveBeenCalledTimes(2)
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
