import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'
import { deferred } from '../helpers/deferred'
import { type commonTypes } from '@vk-audiopad/common'

afterEach(clearPlaybackMocks)

it('inserts after the active track independently in the full and visible queues', async () => {
  const player = await playbackHarness({ currentPlaylist: playlist(['1_1', '1_2']), activeTrack: track('1_2'), activeTrackIndex: 1, audiosIds: [['1_1', ''], ['1_2', ''], ['1_3', '']] })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  await addToQueue(track('1_4'))
  expect(player.snapshot().audiosIds).toEqual([['1_1', ''], ['1_2', ''], ['1_4', ''], ['1_3', '']])
  expect(player.state.currentPlaylist?.tracks.map(item => item.id)).toEqual(['1_1', '1_2', '1_4'])
})

it('does not wrap a next insertion to the front at the end of a queue', async () => {
  const player = await playbackHarness({ currentPlaylist: playlist(['1_1', '1_2']), activeTrack: track('1_2'), audiosIds: [['1_1', ''], ['1_2', '']] })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  await addToQueue(track('1_3'))
  expect(player.snapshot().audiosIds).toEqual([['1_1', ''], ['1_2', ''], ['1_3', '']])
})

it('removes a visible id absent from the full queue without deleting the final full id', async () => {
  const before = playlist(['1_1', '1_9', '1_2'])
  const player = await playbackHarness({ currentPlaylist: before, activeTrack: track('1_1'), audiosIds: [['1_1', ''], ['1_2', '']] })
  const { editCurrentPlaylist } = await import('../../packages/service-worker/src/actions/edit-current-playlist')
  await editCurrentPlaylist(playlist(['1_1', '1_2']), before, [['remove', 1]])
  await player.api.storage.local.get()
  expect(player.snapshot().audiosIds).toEqual([['1_1', ''], ['1_2', '']])
})

it('uses -1 when the playing source is removed from the queue', async () => {
  const player = await playbackHarness({ currentPlaylist: playlist(['1_1', '1_2']), activeTrack: track('1_1'), audiosIds: [['1_1', ''], ['1_2', '']], played: true, playbackId: 'media' })
  const { deleteTrack } = await import('../../packages/service-worker/src/actions/delete-track')
  await deleteTrack(track('1_1'))
  await player.api.storage.local.get()
  expect(player.snapshot()).toMatchObject({ activeTrackIndex: -1, played: true, playbackId: 'media' })
})

it('does not crash while shuffling an empty queue with a stale index', async () => {
  const player = await playbackHarness({ currentPlaylist: playlist([]), activeTrack: track('1_1'), activeTrackIndex: 8 })
  const { onShuffle } = await import('../../packages/service-worker/src/actions/shuffle')
  await expect(onShuffle(true)).resolves.toBeUndefined()
  expect(player.snapshot().activeTrackIndex).toBe(-1)
})

it('serializes rapid insertions against the latest queue instead of losing an earlier edit', async () => {
  const player = await playbackHarness({ currentPlaylist: playlist(['1_1', '1_2']), activeTrack: track('1_1'), audiosIds: [['1_1', ''], ['1_2', '']] })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  await Promise.all([addToQueue(track('1_3')), addToQueue(track('1_4'))])
  expect(player.snapshot().audiosIds).toEqual([['1_1', ''], ['1_4', ''], ['1_3', ''], ['1_2', '']])
  expect(player.state.currentPlaylist?.tracks.map(item => item.id)).toEqual(['1_1', '1_4', '1_3', '1_2'])
})

it('replays insertion and removal over late full-queue hydration without losing unseen tracks', async () => {
  const player = await playbackHarness()
  const response = deferred<commonTypes.AudioTuple[]>()
  player.fetchQueue.mockReturnValueOnce(response.promise)
  const loading = player.playNewTrack('1_2', playlist(['1_1', '1_2']))
  await vi.waitFor(() => { expect(player.fetchQueue).toHaveBeenCalledOnce() })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  const { deleteTrack } = await import('../../packages/service-worker/src/actions/delete-track')
  await addToQueue(track('1_4'))
  await deleteTrack(track('1_1'))
  response.resolve([['1_1', ''], ['1_2', ''], ['1_3', '']])
  await loading
  expect(player.snapshot().audiosIds).toEqual([['1_2', ''], ['1_4', ''], ['1_3', '']])
  expect(player.state.currentPlaylist?.tracks.map(item => item.id)).toEqual(['1_2', '1_4'])
})

it('transfers pending edits when next changes the selected track during hydration', async () => {
  const player = await playbackHarness()
  const response = deferred<commonTypes.AudioTuple[]>()
  player.fetchQueue.mockReturnValueOnce(response.promise).mockResolvedValueOnce([['1_1', ''], ['1_2', ''], ['1_3', '']])
  const first = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  await vi.waitFor(() => { expect(player.fetchQueue).toHaveBeenCalledOnce() })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  await addToQueue(track('1_4'))
  await player.nextTrack()
  response.resolve([['1_1', ''], ['1_2', ''], ['1_8', '']])
  await first
  expect(player.snapshot()).toMatchObject({ activeTrack: { id: '1_4' }, audiosIds: [['1_1', ''], ['1_4', ''], ['1_2', ''], ['1_3', '']] })
})

it('retains a queue edit when a pending next-track URL finishes later', async () => {
  const queue = playlist(['1_1', '1_2', '1_3'])
  const player = await playbackHarness({ currentPlaylist: queue, activeTrack: track('1_1'), audiosIds: [['1_1', ''], ['1_2', ''], ['1_3', '']] })
  const response = deferred<commonTypes.TrackItem | null>()
  player.fetchTrack.mockReturnValueOnce(response.promise)
  const next = player.nextTrack()
  await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  await addToQueue(track('1_4'))
  response.resolve(track('1_2'))
  await next
  expect(player.snapshot()).toMatchObject({ activeTrack: { id: '1_2' }, activeTrackIndex: 2, audiosIds: [['1_1', ''], ['1_4', ''], ['1_2', ''], ['1_3', '']] })
})

it('keeps removal of the playing source after late hydration instead of re-inserting it', async () => {
  const player = await playbackHarness()
  const response = deferred<commonTypes.AudioTuple[]>()
  player.fetchQueue.mockReturnValueOnce(response.promise)
  const loading = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  await vi.waitFor(() => { expect(player.fetchQueue).toHaveBeenCalledOnce() })
  const { deleteTrack } = await import('../../packages/service-worker/src/actions/delete-track')
  await deleteTrack(track('1_1'))
  response.resolve([['1_1', ''], ['1_2', ''], ['1_3', '']])
  await loading
  expect(player.snapshot()).toMatchObject({ activeTrack: { id: '1_1' }, activeTrackIndex: -1, audiosIds: [['1_2', ''], ['1_3', '']] })
})

it('resumes cancelled hydration without refetching the existing media source', async () => {
  const player = await playbackHarness()
  const response = deferred<commonTypes.AudioTuple[]>()
  player.fetchQueue.mockReturnValueOnce(response.promise).mockResolvedValueOnce([['1_1', ''], ['1_2', ''], ['1_3', '']])
  const first = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  await vi.waitFor(() => { expect(player.fetchQueue).toHaveBeenCalledOnce() })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  const { onPlayed } = await import('../../packages/service-worker/src/actions/play-or-pause')
  await addToQueue(track('1_4'))
  await onPlayed(false)
  await onPlayed(true)
  response.resolve([['1_1', ''], ['1_2', '']])
  await first
  expect(player.fetchTrack).toHaveBeenCalledOnce()
  expect(player.snapshot().audiosIds).toEqual([['1_1', ''], ['1_4', ''], ['1_2', ''], ['1_3', '']])
})

it('does not replay a failed edit during hydration and recovers for the next edit', async () => {
  const player = await playbackHarness()
  const response = deferred<commonTypes.AudioTuple[]>()
  player.fetchQueue.mockReturnValueOnce(response.promise)
  const loading = player.playNewTrack('1_1', playlist(['1_1', '1_2']))
  await vi.waitFor(() => { expect(player.fetchQueue).toHaveBeenCalledOnce() })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  player.api.storage.local.set.mockRejectedValueOnce(new Error('Write failed'))
  await expect(addToQueue(track('1_4'))).rejects.toThrow('Write failed')
  await addToQueue(track('1_5'))
  response.resolve([['1_1', ''], ['1_2', ''], ['1_3', '']])
  await loading
  expect(player.snapshot().audiosIds).toEqual([['1_1', ''], ['1_5', ''], ['1_2', ''], ['1_3', '']])
})

it('merges a late metadata page with current edits rather than replacing the playlist', async () => {
  const base = { ...playlist(['1_1', '1_2']), nextOffset: 'page-2', hasMore: true }
  const player = await playbackHarness({ currentPlaylist: base, activeTrack: track('1_1'), audiosIds: [['1_1', ''], ['1_2', ''], ['1_3', '']] })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  const { deleteTrack } = await import('../../packages/service-worker/src/actions/delete-track')
  const { appendCurrentPlaylist } = await import('../../packages/service-worker/src/actions/append-current-playlist')
  await addToQueue(track('1_4'))
  await deleteTrack(track('1_2'))
  const page = { ...playlist(['1_2', '1_3', '1_3']), nextOffset: 'page-3', hasMore: true }
  await appendCurrentPlaylist(base, page)
  expect(player.state.currentPlaylist?.tracks.map(item => item.id)).toEqual(['1_1', '1_4', '1_3'])
  expect(player.state.currentPlaylist?.nextOffset).toBe('page-3')
  await appendCurrentPlaylist(base, { ...page, tracks: [track('1_6')] })
  expect(player.state.currentPlaylist?.tracks.map(item => item.id)).toEqual(['1_1', '1_4', '1_3'])
})

it('rejects stale editor snapshots without writing a wrong queue', async () => {
  const before = playlist(['1_1', '1_2'])
  const player = await playbackHarness({ currentPlaylist: playlist(['1_1', '1_3', '1_2']), activeTrack: track('1_1'), audiosIds: [['1_1', ''], ['1_3', ''], ['1_2', '']] })
  const { editCurrentPlaylist } = await import('../../packages/service-worker/src/actions/edit-current-playlist')
  await editCurrentPlaylist(playlist(['1_2', '1_1']), before, [['move', 0, 1]])
  expect(player.api.storage.local.set).not.toHaveBeenCalled()
})

it('preserves insertion when shuffle is enabled before the queued shuffle action runs', async () => {
  const player = await playbackHarness({ currentPlaylist: playlist(['1_1', '1_2', '1_3']), activeTrack: track('1_2'), audiosIds: [['1_1', ''], ['1_2', ''], ['1_3', '']] })
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  const { onShuffle } = await import('../../packages/service-worker/src/actions/shuffle')
  await player.api.storage.local.set({ shuffle: true })
  await Promise.all([addToQueue(track('1_4')), onShuffle(true)])
  const canonical = [['1_1', ''], ['1_2', ''], ['1_4', ''], ['1_3', '']]
  expect(player.snapshot().originalAudiosIds).toEqual(canonical)
  expect(player.snapshot().audiosIds).not.toEqual(canonical)
  expect(player.state.audiosIds[player.state.activeTrackIndex][0]).toBe('1_2')
  await player.api.storage.local.set({ shuffle: false })
  await onShuffle(false)
  expect(player.snapshot().audiosIds).toEqual(canonical)
})

it('retains canonical order for edits queued before disabling shuffle completes', async () => {
  const player = await playbackHarness({ currentPlaylist: playlist(['1_1', '1_2', '1_3']), activeTrack: track('1_2'), audiosIds: [['1_3', ''], ['1_2', ''], ['1_1', '']], originalAudiosIds: [['1_1', ''], ['1_2', ''], ['1_3', '']], shuffle: true })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  const { onShuffle } = await import('../../packages/service-worker/src/actions/shuffle')
  await player.api.storage.local.set({ shuffle: false })
  await Promise.all([addToQueue(track('1_4')), onShuffle(false)])
  expect(player.snapshot()).toMatchObject({ audiosIds: [['1_1', ''], ['1_2', ''], ['1_4', ''], ['1_3', '']], originalAudiosIds: [] })
})

it('does not apply a command for the old queue to a pending different playlist', async () => {
  const player = await playbackHarness({ currentPlaylist: playlist(['1_1']), activeTrack: track('1_1'), audiosIds: [['1_1', '']] })
  const response = deferred<commonTypes.TrackItem | null>()
  player.fetchTrack.mockReturnValueOnce(response.promise)
  const selecting = player.playNewTrack('2_1', playlist(['2_1'], 'new'))
  await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
  const { addToQueue } = await import('../../packages/service-worker/src/actions/add-to-queue')
  await addToQueue(track('1_4'))
  response.resolve(track('2_1'))
  await selecting
  expect(player.snapshot()).toMatchObject({ currentPlaylist: { id: 'new' }, audiosIds: [['2_1', '']] })
})
