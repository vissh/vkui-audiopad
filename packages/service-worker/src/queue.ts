import { type commonTypes } from '@vk-audiopad/common'

type QueueState = Pick<commonTypes.ApplicationState, 'currentPlaylist' | 'activeTrack' | 'audiosIds' | 'originalAudiosIds'>

export type QueueEdit =
  | { type: 'insert', tuple: commonTypes.AudioTuple, afterId: string | null }
  | { type: 'remove', id: string }
  | { type: 'move', id: string, anchorId: string, after: boolean }

export interface QueueUpdate {
  changes: Partial<commonTypes.ApplicationState>
  edits: QueueEdit[]
}

export const sameQueue = (left: commonTypes.Playlist | null, right: commonTypes.Playlist | null): boolean => left != null && right != null && left.id === right.id && left.ownerId === right.ownerId && left.blockId === right.blockId

const unique = (ids: commonTypes.AudioTuple[]): commonTypes.AudioTuple[] => {
  const seen = new Set<string>()
  return ids.filter(([id]) => {
    if (seen.has(id)) return false
    seen.add(id)
    return true
  }).map(([id, key]) => [id, key])
}

export const applyQueueEdits = (ids: commonTypes.AudioTuple[], edits: QueueEdit[]): commonTypes.AudioTuple[] => {
  let result = unique(ids)
  for (const edit of edits) {
    if (edit.type === 'remove') result = result.filter(([id]) => id !== edit.id)
    else if (edit.type === 'insert') {
      result = result.filter(([id]) => id !== edit.tuple[0])
      const anchor = edit.afterId == null ? -1 : result.findIndex(([id]) => id === edit.afterId)
      result.splice(anchor + 1, 0, [...edit.tuple])
    } else {
      const from = result.findIndex(([id]) => id === edit.id)
      const anchor = result.findIndex(([id]) => id === edit.anchorId)
      if (from < 0 || anchor < 0 || from === anchor) continue
      const [tuple] = result.splice(from, 1)
      const target = result.findIndex(([id]) => id === edit.anchorId) + Number(edit.after)
      result.splice(target, 0, tuple)
    }
  }
  return result
}

const indexOfActive = (state: QueueState, ids: commonTypes.AudioTuple[]): number => ids.findIndex(([id]) => id === state.activeTrack?.id)

const update = (state: QueueState, tracks: commonTypes.TrackItem[], edits: QueueEdit[]): QueueUpdate => {
  const shuffled = state.originalAudiosIds.length > 0
  const canonical = shuffled ? state.originalAudiosIds : state.audiosIds
  const audiosIds = applyQueueEdits(state.audiosIds, shuffled ? edits.filter(edit => edit.type !== 'move') : edits)
  return {
    changes: {
      currentPlaylist: state.currentPlaylist == null ? null : { ...state.currentPlaylist, tracks },
      audiosIds,
      originalAudiosIds: shuffled ? applyQueueEdits(canonical, edits) : [],
      activeTrackIndex: indexOfActive(state, audiosIds)
    },
    edits
  }
}

export const insertNext = (state: QueueState, track: commonTypes.TrackItem): QueueUpdate | null => {
  if (state.currentPlaylist == null || state.activeTrack == null || state.activeTrack.id === track.id) return null
  const activeId = state.activeTrack.id
  const tracks = state.currentPlaylist.tracks.filter(item => item.id !== track.id)
  const anchor = tracks.findIndex(item => item.id === activeId)
  const position = anchor >= 0 ? anchor + 1 : state.audiosIds.some(([id]) => id === activeId) ? tracks.length : 0
  tracks.splice(position, 0, track)
  return update(state, tracks, [{ type: 'insert', tuple: [track.id, track.accessKey], afterId: activeId }])
}

export const removeFromQueue = (state: QueueState, id: string): QueueUpdate | null => {
  if (state.currentPlaylist == null) return null
  return update(state, state.currentPlaylist.tracks.filter(track => track.id !== id), [{ type: 'remove', id }])
}

export const editQueue = (state: QueueState, before: commonTypes.Playlist, proposed: commonTypes.Playlist, actions: commonTypes.EditActions): QueueUpdate | null => {
  if (!sameQueue(state.currentPlaylist, before) || !sameQueue(before, proposed) || state.currentPlaylist == null || before.tracks.length !== state.currentPlaylist.tracks.length || before.tracks.some((track, index) => track.id !== state.currentPlaylist?.tracks[index].id)) return null
  const tracks = [...state.currentPlaylist.tracks]
  const edits: QueueEdit[] = []
  for (const action of actions) {
    const from = action[1]
    if (!Number.isInteger(from) || from < 0 || from >= tracks.length) return null
    if (action[0] === 'remove') {
      edits.push({ type: 'remove', id: tracks[from].id })
      tracks.splice(from, 1)
    } else {
      const to = action[2]
      if (!Number.isInteger(to) || to < 0 || to >= tracks.length) return null
      if (from === to) continue
      edits.push({ type: 'move', id: tracks[from].id, anchorId: tracks[to].id, after: from < to })
      const [track] = tracks.splice(from, 1)
      tracks.splice(to, 0, track)
    }
  }
  if (tracks.length !== proposed.tracks.length || tracks.some((track, index) => track.id !== proposed.tracks[index].id)) return null
  return update(state, tracks, edits)
}

export const shuffleQueue = (state: QueueState, enabled: boolean, reorder: (ids: commonTypes.AudioTuple[]) => commonTypes.AudioTuple[]): QueueUpdate => {
  const original = unique(state.originalAudiosIds)
  const audiosIds = enabled
    ? original.length > 0 ? unique(state.audiosIds) : reorder(unique(state.audiosIds))
    : original.length > 0 ? original : unique(state.audiosIds)
  return {
    changes: { audiosIds, originalAudiosIds: enabled ? original.length > 0 ? original : unique(state.audiosIds) : [], activeTrackIndex: indexOfActive(state, audiosIds) },
    edits: []
  }
}
