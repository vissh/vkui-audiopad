import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { setCurrentTime } from '../handlers/change-current-time'
import { setVolume } from '../handlers/change-volume'
import { playOrPause } from '../handlers/play-or-pause'
import { playTrack } from '../handlers/play-track'

export const startListeningMessages = (): void => {
  chrome.runtime.onMessage.addListener((message: commonTypes.Message) => {
    if (message.target !== commonTypes.MessageType.OFFSCREEN) {
      return
    }

    switch (message.type) {
      case 'play-track':
        void playTrack(message.url, message.volume)
        break
      case 'play-or-pause':
        playOrPause(message.played)
        break
      case 'set-volume':
        setVolume(message.value)
        break
      case 'set-current-time':
        setCurrentTime(message.value)
        break
      default:
        commonUtils.assertUnreachable(message)
    }
  })
}
