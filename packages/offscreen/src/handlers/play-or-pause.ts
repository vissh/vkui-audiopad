import { commonTypes } from '@vk-audiopad/common'
import { audioElement } from '../audio-element'

export const playOrPause = (played: boolean): void => {
  if (audioElement.src.length > 0) {
    if (played) {
      void audioElement.play()
    } else {
      audioElement.pause()
    }
  } else if (played) {
    const message: commonTypes.ReloadTrackMessage = {
      target: commonTypes.MessageType.SERVICE_WORKER,
      type: 'reload-track'
    }
    void (chrome.runtime.sendMessage(message))
  }
}
