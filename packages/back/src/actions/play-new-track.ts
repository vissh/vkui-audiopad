import { commonTypes } from '@vk-audiopad/common'
import { fetchAudiosIdsBySource } from '../fetchers/audio-ids-by-source'
import { fetchTrackInfo } from '../fetchers/track-info'
import { destroyPlayer, playTrack } from '../player'
import { applicationState } from '../state'
import { createAudiosIds, getNewIndex, sendListenedData, shuffle } from '../utils'

export const playNewTrack = async (trackIndex: number, playlist: commonTypes.Playlist, fromOriginalSort?: boolean): Promise<void> => {
  destroyPlayer()
  sendListenedData(commonTypes.EndOfStreamReason.NEW)

  const currentPlaylist = applicationState.currentPlaylist

  const isNewPlaylist: boolean = (currentPlaylist == null) || differentPlaylists(playlist, currentPlaylist)

  let audiosIds = applicationState.audiosIds
  const originalAudiosIds = applicationState.originalAudiosIds

  if (isNewPlaylist) {
    audiosIds = createAudiosIds(playlist.tracks)
  }

  let trackId: string
  let accessKey: string
  let track: commonTypes.TrackItem

  if (!isNewPlaylist && (fromOriginalSort ?? false) && applicationState.shuffle) {
    [trackId, accessKey] = originalAudiosIds[trackIndex] ?? originalAudiosIds[0]
    trackIndex = audiosIds.findIndex(([elementTrackId]) => elementTrackId === trackId)
  } else {
    [trackId, accessKey] = audiosIds[trackIndex] ?? audiosIds[0]
  }

  if (playlist.isRadio) {
    track = playlist.tracks[trackIndex]
  } else {
    const possibleTrack = await fetchTrackInfo(applicationState.userId, trackId, accessKey)
    if (possibleTrack == null) {
      const newIndex = getNewIndex('next', applicationState.activeTrackIndex, applicationState.audiosIds.length)
      await playNewTrack(newIndex, playlist, fromOriginalSort)
      return
    }
    track = possibleTrack
  }

  const changes: Partial<commonTypes.ApplicationState> = {
    activeTrack: track,
    activeTrackIndex: trackIndex
  }

  if (isNewPlaylist) {
    changes.currentPlaylist = playlist
    changes.audiosIds = audiosIds
  }

  void chrome.storage.local.set(changes)

  playTrack(track)

  if (isNewPlaylist && !playlist.isRadio) {
    const audiosIds = await fetchAudiosIdsBySource(playlist)

    if (applicationState.shuffle) {
      const shuffledAudiosIds = shuffle(audiosIds)
      const newActiveTrackIndex = shuffledAudiosIds.findIndex(([trackId]) => trackId === track.id)

      void chrome.storage.local.set({
        ...changes,
        activeTrackIndex: newActiveTrackIndex,
        audiosIds: shuffledAudiosIds,
        originalAudiosIds: audiosIds
      })
    } else {
      void chrome.storage.local.set({ audiosIds, originalAudiosIds: [] })
    }
  }
}

const differentPlaylists = (newPlaylist: commonTypes.Playlist, oldPlaylist: commonTypes.Playlist): boolean => {
  if (newPlaylist.id !== oldPlaylist.id ||
    newPlaylist.ownerId !== oldPlaylist.ownerId ||
    newPlaylist.blockId !== oldPlaylist.blockId ||
    newPlaylist.tracks.length !== oldPlaylist.tracks.length) {
    return true
  }

  const newAudioIds = createAudiosIds(newPlaylist.tracks)
  const oldAudioIds = createAudiosIds(oldPlaylist.tracks)

  return !newAudioIds.every(([trackId], index) => trackId === oldAudioIds[index][0])
}
