import { commonTypes } from '@vk-audiopad/common'
import { audioElement } from '../audio-element'
import { sendMessage } from '../send-message'

export const startListeningPlayerEvents = (): void => {
  audioElement.addEventListener('playing', sendPlaying)
  audioElement.addEventListener('pause', sendPause)
  audioElement.addEventListener('ended', sendEnded)
  audioElement.addEventListener('error', sendError)
  audioElement.addEventListener('timeupdate', sendTimeupdate)
}

const sendPlaying = (): void => {
  void sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.AUDIO_PLAYER_PLAYING,
    volume: audioElement.volume,
    duration: audioElement.duration,
    currentTime: audioElement.currentTime
  })
}

const sendPause = (): void => {
  void sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.AUDIO_PLAYER_PAUSE
  })
}

const sendEnded = (): void => {
  void sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.AUDIO_PLAYER_ENDED
  })
}

const sendError = (): void => {
  void sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.AUDIO_PLAYER_ENDED
  })
}

const sendTimeupdate = (): void => {
  void sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.AUDIO_PLAYER_TIMEUPDATED,
    paused: audioElement.paused,
    duration: audioElement.duration,
    currentTime: audioElement.currentTime
  })
}
