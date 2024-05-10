import { type commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'

export const editCurrentPlaylist = (
  playlist: commonTypes.Playlist,
  oldPlaylist: commonTypes.Playlist,
  actions: commonTypes.EditActions
): void => {
  const trackId = applicationState.activeTrack?.id
  if (trackId == null) {
    return
  }

  let audiosIds = applicationState.audiosIds
  let originalAudiosIds = applicationState.originalAudiosIds

  if (originalAudiosIds.length > 0) {
    originalAudiosIds = changeAudiosIds(oldPlaylist.tracks, originalAudiosIds, actions)

    // Только когда shuffle нужно отдельно пройтись по сохраненному массиву, чтобы удалить треки.
    // Сохранение порядка в данном случае не интересует, так как треки и так были перемешаны.
    const newTrackIds = new Set(playlist.tracks.map(t => t.id))
    const oldTrackIds = oldPlaylist.tracks.map(track => track.id)
    const deletedTrackIds = new Set(oldTrackIds.filter(trackId => !newTrackIds.has(trackId)))

    audiosIds = audiosIds.filter(([trackId]) => !deletedTrackIds.has(trackId))
  } else {
    audiosIds = changeAudiosIds(oldPlaylist.tracks, audiosIds, actions)
  }

  const activeTrackIndex = Math.max(0, audiosIds.findIndex(audioTuple => audioTuple[0] === trackId))

  void chrome.storage.local.set({
    activeTrackIndex,
    audiosIds,
    originalAudiosIds
  })
}

const changeAudiosIds = (
  oldTracks: commonTypes.TrackItem[],
  audiosIds: commonTypes.AudioTuple[],
  actions: commonTypes.EditActions
): commonTypes.AudioTuple[] => {
  let result = [...audiosIds]
  let tracks = [...oldTracks]

  actions.forEach(action => {
    if (action[0] === 'remove') {
      const trackIndex = action[1]
      const track = tracks[trackIndex]
      const audiosIdsIndex = result.findIndex(([trackId]) => trackId === track.id)
      tracks.splice(trackIndex, 1)
      result.splice(audiosIdsIndex, 1)
    } else if (action[0] === 'move') {
      const [fromTrackIndex, toTrackIndex] = [action[1], action[2]]

      const fromTrack = tracks[fromTrackIndex]
      const toTrack = tracks[toTrackIndex]
      const fromAudiosIdsIndex = result.findIndex(([trackId]) => trackId === fromTrack.id)
      const toAudiosIdsIndex = result.findIndex(([trackId]) => trackId === toTrack.id)

      const tmpTracks = [...tracks]
      tmpTracks.splice(fromTrackIndex, 1)
      tmpTracks.splice(toTrackIndex, 0, tracks[fromTrackIndex])
      tracks = tmpTracks

      const ids = [...result]
      ids.splice(fromAudiosIdsIndex, 1)
      ids.splice(toAudiosIdsIndex, 0, result[fromAudiosIdsIndex])
      result = ids
    }
  })

  return result
}
