import { type commonTypes } from '@vk-audiopad/common'
import { getPlaybackOperation } from '../playback-operation'
import { applyQueueEdits, sameQueue } from '../queue'
import { mutateQueue } from '../queue-state'

export const appendCurrentPlaylist = async (base: commonTypes.Playlist, page: commonTypes.Playlist): Promise<void> => {
  await mutateQueue(state => {
    const current = state.currentPlaylist
    if (!sameQueue(current, base) || !sameQueue(current, page) || current == null || current.nextOffset !== base.nextOffset) return null
    const operation = getPlaybackOperation()
    const hydrating = operation?.hydrating === true
    const ids = hydrating
      ? applyQueueEdits(page.tracks.map(track => [track.id, track.accessKey]), operation.queueEdits)
      : state.audiosIds
    const allowed = new Set(ids.map(([id]) => id))
    const seen = new Set(current.tracks.map(track => track.id))
    const added = page.tracks.filter(track => {
      if (seen.has(track.id) || !allowed.has(track.id)) return false
      seen.add(track.id)
      return true
    })
    return {
      changes: { currentPlaylist: { ...current, tracks: [...current.tracks, ...added], nextOffset: page.nextOffset, hasMore: page.hasMore && (hydrating || state.audiosIds.length > 0) } },
      edits: []
    }
  })
}
