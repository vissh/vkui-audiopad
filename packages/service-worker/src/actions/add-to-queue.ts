import { type commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'
import { getNewIndex } from '../utils'

export const addToQueue = async (track: commonTypes.TrackItem): Promise<void> => {
  if ((applicationState.currentPlaylist == null) || (applicationState.activeTrack == null)) {
    return
  }

  const audioTuple: commonTypes.AudioTuple = [track.id, track.accessKey]

  const newAudioIds = [...applicationState.audiosIds]
  const newOriginalAudiosIds = [...applicationState.originalAudiosIds]
  const newCurrentPlaylist: commonTypes.Playlist = {
    ...applicationState.currentPlaylist,
    tracks: [...applicationState.currentPlaylist.tracks]
  }

  const indexInAudiosIds = newAudioIds.findIndex(([trackId]) => trackId === track.id)
  if (indexInAudiosIds !== -1) {
    newAudioIds.splice(indexInAudiosIds, 1)
  }

  const indexInOriginalAudiosIds = newOriginalAudiosIds.findIndex(([trackId]) => trackId === track.id)
  if (indexInOriginalAudiosIds !== -1) {
    newOriginalAudiosIds.splice(indexInOriginalAudiosIds, 1)
  }

  const indexInCurrentPlaylist = newCurrentPlaylist.tracks.findIndex(x => x.id === track.id)
  if (indexInCurrentPlaylist !== -1) {
    newCurrentPlaylist.tracks.splice(indexInCurrentPlaylist, 1)
  }

  const newActiveTrackIndex = newAudioIds.findIndex(([trackId]) => trackId === applicationState.activeTrack?.id)
  const newOriginalActiveTrackIndex = newOriginalAudiosIds.findIndex(([trackId]) => trackId === applicationState.activeTrack?.id)

  let addToIndex = getNewIndex('next', newActiveTrackIndex, newAudioIds.length)
  newAudioIds.splice(addToIndex, 0, audioTuple)

  if (newOriginalActiveTrackIndex !== -1) {
    addToIndex = getNewIndex('next', newOriginalActiveTrackIndex, newOriginalAudiosIds.length)
    newOriginalAudiosIds.splice(addToIndex, 0, audioTuple)
  }

  if (newCurrentPlaylist.tracks.length > addToIndex) {
    newCurrentPlaylist.tracks.splice(addToIndex, 0, track)
  }

  const partialState: Partial<commonTypes.ApplicationState> = {
    activeTrackIndex: newAudioIds.findIndex(([trackId]) => trackId === applicationState.activeTrack?.id),
    audiosIds: newAudioIds,
    originalAudiosIds: newOriginalAudiosIds,
    currentPlaylist: newCurrentPlaylist
  }

  void chrome.storage.local.set(partialState)
}
