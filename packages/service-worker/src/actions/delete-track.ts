import { type commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'

export const deleteTrack = async (track: commonTypes.TrackItem): Promise<void> => {
  if ((applicationState.currentPlaylist == null) || (applicationState.activeTrack == null)) {
    return
  }

  const changes: Partial<commonTypes.ApplicationState> = {}

  const newTracks = applicationState.currentPlaylist.tracks.filter(x => x.id !== track.id)
  const newAudiosIds = applicationState.audiosIds.filter(([trackId]) => trackId !== track.id)
  const originalAudiosIds = applicationState.originalAudiosIds.filter(([trackId]) => trackId !== track.id)

  if (newTracks.length !== applicationState.currentPlaylist.tracks.length) {
    changes.currentPlaylist = { ...applicationState.currentPlaylist, tracks: newTracks }
  }

  if (newAudiosIds.length !== applicationState.audiosIds.length) {
    changes.audiosIds = newAudiosIds
    changes.activeTrackIndex = Math.max(0, newAudiosIds.findIndex(([trackId]) => trackId === applicationState.activeTrack?.id))
  }

  if (originalAudiosIds.length !== applicationState.originalAudiosIds.length) {
    changes.originalAudiosIds = originalAudiosIds
  }

  if (Object.keys(changes).length > 0) {
    void chrome.storage.local.set(changes)
  }
}
