import { commonTypes } from '@vk-audiopad/common'
import { audioElement } from '../audio-element'

export const startListeningPlayerEvents = (): void => {
  audioElement.addEventListener('playing', sendPlaying)
  audioElement.addEventListener('pause', sendPause)
  audioElement.addEventListener('ended', sendEnded)
  audioElement.addEventListener('error', sendError)
  audioElement.addEventListener('timeupdate', sendTimeupdate)
}

const sendPlaying = (): void => {
  sendMessage({
    target: commonTypes.MessageType.SERVICE_WORKER,
    type: 'audio-player-playing',
    volume: audioElement.volume,
    duration: audioElement.duration,
    currentTime: audioElement.currentTime
  })
}

const sendPause = (): void => {
  sendMessage({
    target: commonTypes.MessageType.SERVICE_WORKER,
    type: 'audio-player-pause'
  })
}

const sendEnded = (): void => {
  sendMessage({
    target: commonTypes.MessageType.SERVICE_WORKER,
    type: 'audio-player-ended'
  })
}

const sendError = (): void => {
  sendMessage({
    target: commonTypes.MessageType.SERVICE_WORKER,
    type: 'audio-player-error'
  })
}

const sendTimeupdate = (): void => {
  sendMessage({
    target: commonTypes.MessageType.SERVICE_WORKER,
    type: 'audio-player-timeupdate',
    paused: audioElement.paused,
    duration: audioElement.duration,
    currentTime: audioElement.currentTime
  })
}

const sendMessage = (message: commonTypes.Message): void => {
  void (chrome.runtime.sendMessage(message))
}
