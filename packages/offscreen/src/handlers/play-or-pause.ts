import { commonTypes } from '@vk-audiopad/common'
import { audioElement } from '../audio-element'
import { sendMessage } from '../send-message'

export const playOrPause = (played: boolean): void => {
  if (audioElement.src.length > 0) {
    if (played) {
      void audioElement.play()
    } else {
      audioElement.pause()
    }
  } else if (played) {
    void sendMessage({
      target: commonTypes.MessageTarget.SERVICE_WORKER,
      type: commonTypes.MessageType.RELOAD_TRACK
    })
  }
}
