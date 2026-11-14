import { commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'
import { commitPlayback } from '../playback-operation'
import { sendListenedData } from '../utils'
import { playNewTrack } from './play-new-track'

export const repeat = async (): Promise<void> => {
  const nextMode = {
    [commonTypes.RepeatMode.NONE]: commonTypes.RepeatMode.REPEAT,
    [commonTypes.RepeatMode.REPEAT]: commonTypes.RepeatMode.REPEAT_ONE,
    [commonTypes.RepeatMode.REPEAT_ONE]: commonTypes.RepeatMode.NONE
  }
  await commitPlayback(() => true, () => ({ repeat: nextMode[applicationState.repeat ?? commonTypes.RepeatMode.NONE] }))
}

export const playCurrentTrack = async (): Promise<void> => {
  sendListenedData(commonTypes.EndOfStreamReason.NEW)
  if ((applicationState.activeTrack != null) && (applicationState.currentPlaylist != null)) {
    await playNewTrack(applicationState.activeTrack.id, applicationState.currentPlaylist)
  }
}
