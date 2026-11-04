import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { changeCurrentTime } from '../handlers/change-current-time'
import { changeVolume } from '../handlers/change-volume'
import { playOrPause } from '../handlers/play-or-pause'
import { playTrack } from '../handlers/play-track'
import { getPlayerSnapshot } from '../player-snapshot'
import { sendMessage } from '../send-message'
import { noteActivity } from '../activity'

export const startListeningMessages = (): void => {
  chrome.runtime.onMessage.addListener(messageHandler)
  commonUtils.addBackgroundMessageListener(messageHandler)
}

const messageHandler = (message: commonTypes.Message): void => {
  if (message.target !== commonTypes.MessageTarget.OFFSCREEN) {
    return
  }

  if (message.type !== commonTypes.MessageType.GET_PLAYER_SNAPSHOT) noteActivity()

  switch (message.type) {
    case commonTypes.MessageType.GET_PLAYER_SNAPSHOT:
      void sendMessage({
        target: commonTypes.MessageTarget.SERVICE_WORKER,
        type: commonTypes.MessageType.PLAYER_SNAPSHOT,
        requestId: message.requestId,
        snapshot: getPlayerSnapshot()
      }).catch(() => { console.warn('Player snapshot could not be delivered') })
      break
    case commonTypes.MessageType.PLAY_TRACK:
      void playTrack(message.url, message.volume, message.playbackId)
      break
    case commonTypes.MessageType.PLAY_OR_PAUSE:
      playOrPause(message.played)
      break
    case commonTypes.MessageType.CHANGE_VOLUME:
      changeVolume(message.value)
      break
    case commonTypes.MessageType.CHANGE_CURRENT_TIME:
      changeCurrentTime(message.value)
      break
    default:
      commonUtils.assertUnreachable(message)
  }
}
