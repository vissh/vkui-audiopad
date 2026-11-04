import { commonTypes, initialState } from '@vk-audiopad/common'
import { vi } from 'vitest'
import { createChrome } from './chrome'

export const track = (id: string): commonTypes.TrackItem => ({
  id,
  fromAct: true,
  accessKey: '',
  url: `https://audio.invalid/${id}.mp3`,
  image: '',
  artist: 'Artist',
  mainArtists: [],
  featArtists: [],
  title: id,
  duration: 30,
  context: '',
  flags: commonTypes.TrackFlagBit.CAN_ADD,
  trackCode: '',
  addHash: '',
  editHash: '',
  actionHash: '',
  deleteHash: '',
  replaceHash: '',
  urlHash: '',
  restoreHash: ''
})

export const playlist = (ids: string[], id = 'playlist'): commonTypes.Playlist => ({
  id,
  ownerId: '1',
  blockId: id,
  title: id,
  tracks: ids.map(track),
  isRadio: false,
  isVkMix: false,
  accessHash: '',
  nextOffset: '',
  hasMore: false,
  followHash: '',
  isFollowed: false
})

export const playbackHarness = async (initial: Partial<commonTypes.ApplicationState> = {}, options: { realState?: boolean, realTransport?: boolean } = {}) => {
  const state = { ...structuredClone(initialState.Application), ...initial }
  const browser = createChrome(state)
  browser.api.storage.local.onChanged.addListener(changes => {
    Object.assign(state, Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.newValue])))
  })
  const fetchTrack = vi.fn(async (_owner: string, id: string, _accessKey: string, _signal?: AbortSignal): Promise<commonTypes.TrackItem | null> => track(id))
  const fetchQueue = vi.fn(async (value: commonTypes.Playlist, _signal?: AbortSignal): Promise<commonTypes.AudioTuple[]> => value.tracks.map(item => [item.id, item.accessKey]))
  const fetchMix = vi.fn(async (_signal?: AbortSignal) => track('1_100'))
  const play = vi.fn(async (..._args: unknown[]) => {})
  const pause = vi.fn(async (..._args: unknown[]) => {})
  if (options.realState === true) vi.doUnmock('../../packages/service-worker/src/state')
  else vi.doMock('../../packages/service-worker/src/state', () => ({ applicationState: state }))
  vi.doMock('../../packages/service-worker/src/fetchers/track-info', () => ({ fetchTrackInfo: fetchTrack }))
  vi.doMock('../../packages/service-worker/src/fetchers/audio-ids-by-source', () => ({ fetchAudiosIdsBySource: fetchQueue }))
  vi.doMock('../../packages/service-worker/src/fetchers/listened-data', () => ({ fetchListenedData: vi.fn(async () => {}) }))
  if (options.realTransport === true) {
    vi.doUnmock('../../packages/service-worker/src/offscreen/play-track')
    vi.doUnmock('../../packages/service-worker/src/offscreen/play-or-pause')
  } else {
    vi.doMock('../../packages/service-worker/src/offscreen/play-track', () => ({ playTrack: play }))
    vi.doMock('../../packages/service-worker/src/offscreen/play-or-pause', () => ({ playOrPause: pause }))
  }
  vi.doMock('@vk-audiopad/common', async importOriginal => {
    const original = await importOriginal<typeof import('@vk-audiopad/common')>()
    return { ...original, vkApiClient: { ...original.vkApiClient, getStreamMixAudios: fetchMix } }
  })
  const { playNewTrack } = await import('../../packages/service-worker/src/actions/play-new-track')
  const { nextTrack, previousTrack } = await import('../../packages/service-worker/src/actions/next')
  const runtimeState = options.realState === true ? (await import('../../packages/service-worker/src/state')).applicationState : state
  return { ...browser, state: runtimeState, fetchTrack, fetchQueue, fetchMix, play, pause, playNewTrack, nextTrack, previousTrack }
}

export const clearPlaybackMocks = () => {
  for (const path of [
    '../../packages/service-worker/src/state',
    '../../packages/service-worker/src/fetchers/track-info',
    '../../packages/service-worker/src/fetchers/audio-ids-by-source',
    '../../packages/service-worker/src/fetchers/listened-data',
    '../../packages/service-worker/src/offscreen/play-track',
    '../../packages/service-worker/src/offscreen/play-or-pause',
    '@vk-audiopad/common'
  ]) vi.doUnmock(path)
}
