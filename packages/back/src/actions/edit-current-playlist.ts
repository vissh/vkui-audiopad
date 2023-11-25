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
    originalAudiosIds = changeAudiosIds(originalAudiosIds, actions)

    // Только когда shuffle нужно отдельно пройтись по сохраненному массиву, чтобы удалить треки.
    // Сохранение порядка в данном случае не интересует, так как треки и так были перемешаны.
    const newTrackIds = new Set(playlist.tracks.map(t => t.id))
    const oldTrackIds = oldPlaylist.tracks.map(track => track.id)
    const deletedTrackIds = new Set(oldTrackIds.filter(trackId => !newTrackIds.has(trackId)))

    audiosIds = audiosIds.filter(([trackId]) => !deletedTrackIds.has(trackId))
  } else {
    audiosIds = changeAudiosIds(audiosIds, actions)
  }

  const activeTrackIndex = Math.max(0, audiosIds.findIndex(audioTuple => audioTuple[0] === trackId))

  void chrome.storage.local.set({
    activeTrackIndex,
    audiosIds,
    originalAudiosIds
  })
}

const changeAudiosIds = (audiosIds: commonTypes.AudioTuple[], actions: commonTypes.EditActions): commonTypes.AudioTuple[] => {
  let result = [...audiosIds]
  actions.forEach(action => {
    if (action[0] === 'remove') {
      result.splice(action[1], 1)
    } else if (action[0] === 'move') {
      const [from, to] = [action[1], action[2]]
      const ids = [...result]
      ids.splice(from, 1)
      ids.splice(to, 0, result[from])
      result = ids
    }
  })

  return result
}
