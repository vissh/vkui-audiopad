import { commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'
import { type ActionType } from '../types'
import { getNewIndex, sendListenedData } from '../utils'
import { playNewTrack } from './play-new-track'

export const nextTrack = async (): Promise<void> => {
  sendListenedData(commonTypes.EndOfStreamReason.NEXT)
  await playNewTrackByIndex('next')
}

export const previousTrack = async (): Promise<void> => {
  sendListenedData(commonTypes.EndOfStreamReason.PREV)
  await playNewTrackByIndex('prev')
}

const playNewTrackByIndex = async (action: ActionType): Promise<void> => {
  if (applicationState.currentPlaylist == null) {
    return
  }

  let newIndex = 0

  if (applicationState.currentPlaylist.isRadio) {
    const tracks = applicationState.currentPlaylist.tracks
    newIndex = getNewIndex(action, applicationState.activeTrackIndex, tracks.length)
  } else {
    newIndex = getNewIndex(action, applicationState.activeTrackIndex, applicationState.audiosIds.length)
  }

  await playNewTrack(newIndex, applicationState.currentPlaylist)
}
