import { commonTypes, vkApiClient } from '@vk-audiopad/common'
import { fetchAudiosIdsBySource } from '../fetchers/audio-ids-by-source'
import { fetchTrackInfo } from '../fetchers/track-info'
import { playTrack } from '../offscreen/play-track'
import { applicationState } from '../state'
import { createAudiosIds, getNewIndex, sendListenedData, shuffle } from '../utils'

const MAX_VK_MIX_HISTORY = 30

export const playNewTrack = async (newTrackId: string | null, playlist: commonTypes.Playlist): Promise<void> => {
  sendListenedData(commonTypes.EndOfStreamReason.NEW)

  const isNewPlaylist: boolean = (applicationState.currentPlaylist == null) || differentPlaylists(playlist, applicationState.currentPlaylist)
  const savePlaylist: boolean = isNewPlaylist || playlist.isVkMix

  let audiosIds = isNewPlaylist ? createAudiosIds(playlist.tracks) : applicationState.audiosIds
  let track: commonTypes.TrackItem
  let trackIndex: number

  if (playlist.isRadio) {
    const foundIndex = newTrackId != null ? playlist.tracks.findIndex((track) => track.id === newTrackId) : 0
    if (foundIndex === -1) {
      throw new Error(`Radio-track ${newTrackId} not found`)
    }
    track = playlist.tracks[foundIndex]
    trackIndex = foundIndex
  } else if (playlist.isVkMix) {
    if (newTrackId == null) {
      track = await vkApiClient.getStreamMixAudios()
      if (playlist.tracks.length >= MAX_VK_MIX_HISTORY) {
        playlist.tracks.splice(0, 1)
        playlist.id = (+new Date().getTime()).toString()
      }
      trackIndex = playlist.tracks.push(track) - 1
    } else {
      const foundIndex = newTrackId != null ? audiosIds.findIndex(([trackId]) => trackId === newTrackId) : 0
      const [trackId, accessKey] = audiosIds[foundIndex]
      const possibleTrack = await fetchTrackInfo(applicationState.userId, trackId, accessKey)
      if (possibleTrack == null) {
        return
      }
      track = possibleTrack
      trackIndex = foundIndex
    }
    audiosIds = createAudiosIds(playlist.tracks)
  } else {
    let foundIndex = newTrackId != null ? audiosIds.findIndex(([trackId]) => trackId === newTrackId) : 0
    if (foundIndex === -1) {
      audiosIds = createAudiosIds(playlist.tracks)
      foundIndex = audiosIds.findIndex(([trackId]) => trackId === newTrackId)
      if (foundIndex === -1) {
        throw new Error(`Track ${newTrackId} not found`)
      }
    }

    const [trackId, accessKey] = audiosIds[foundIndex]
    const possibleTrack = await fetchTrackInfo(applicationState.userId, trackId, accessKey)

    if (possibleTrack == null) {
      const [newIndex] = getNewIndex('next', foundIndex, audiosIds.length)
      await new Promise(resolve => setTimeout(resolve, 500))
      await playNewTrack(audiosIds[newIndex][0], playlist)
      return
    }
    track = possibleTrack
    trackIndex = foundIndex
  }

  const changes: Partial<commonTypes.ApplicationState> = {
    activeTrack: track,
    activeTrackIndex: trackIndex
  }

  if (savePlaylist) {
    changes.currentPlaylist = playlist
    changes.audiosIds = audiosIds
  }

  void chrome.storage.local.set(changes)

  await playTrack(track.url, applicationState.volume)

  if (isNewPlaylist && !playlist.isRadio && !playlist.isVkMix) {
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
