import { commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'
import { type ActionType } from '../types'
import { getNewIndex, sendListenedData } from '../utils'
import { playNewTrack } from './play-new-track'
import { getPlaybackOperation, type PlaybackOperation } from '../playback-operation'

export const nextTrack = async (operation?: PlaybackOperation): Promise<void> => {
  sendListenedData(commonTypes.EndOfStreamReason.NEXT)
  await playNewTrackByIndex('next', operation)
}

export const previousTrack = async (): Promise<void> => {
  sendListenedData(commonTypes.EndOfStreamReason.PREV)
  await playNewTrackByIndex('prev')
}

const playNewTrackByIndex = async (action: ActionType, retry?: PlaybackOperation): Promise<void> => {
  const operation = getPlaybackOperation()
  const pending = operation?.loading === true ? operation : null
  const playlist = pending?.playlist ?? applicationState.currentPlaylist
  if (playlist == null) {
    return
  }

  let trackId: string | null
  const ids = pending?.audiosIds ?? applicationState.audiosIds
  const selectedId = pending?.trackId ?? applicationState.activeTrack?.id
  const selectedIndex = pending?.playlist.isVkMix === true && pending.trackId == null
    ? ids.length
    : selectedId == null ? -1 : ids.findIndex(([id]) => id === selectedId)
  const index = selectedIndex < 0 && action === 'prev' ? 0 : selectedIndex

  if (playlist.isRadio || playlist.isVkMix) {
    const tracks = playlist.tracks
    const [newIndex, overflow] = getNewIndex(action, index, tracks.length)
    trackId = playlist.isVkMix && (overflow || tracks.length === 0) ? null : tracks[newIndex]?.id ?? null
  } else {
    const [newIndex] = getNewIndex(action, index, ids.length)
    trackId = ids[newIndex]?.[0] ?? null
  }

  await playNewTrack(trackId, playlist, retry)
}
