import { commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'
import { storage } from '../storage'
import { sendListenedData } from '../utils'
import { playNewTrack } from './play-new-track'

export const repeat = async (): Promise<void> => {
  const nextMode = {
    [commonTypes.RepeatMode.NONE]: commonTypes.RepeatMode.REPEAT,
    [commonTypes.RepeatMode.REPEAT]: commonTypes.RepeatMode.REPEAT_ONE,
    [commonTypes.RepeatMode.REPEAT_ONE]: commonTypes.RepeatMode.NONE
  }
  const value = applicationState.repeat ?? commonTypes.RepeatMode.NONE
  await storage.repeat.set(nextMode[value])
}

export const playCurrentTrack = async (): Promise<void> => {
  sendListenedData(commonTypes.EndOfStreamReason.NEW)
  if ((applicationState.activeTrack != null) && (applicationState.currentPlaylist != null)) {
    await playNewTrack(applicationState.activeTrack.id, applicationState.currentPlaylist)
  }
}
