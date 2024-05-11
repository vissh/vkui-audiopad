import { commonTypes } from '@vk-audiopad/common'
import { audioElement } from './audio-element'
import { destroyPlayer } from './handlers/play-track'

const MIN_IDLE_TIME = 5 * 60 * 1000
const CHECK_INTERVAL = 1 * 60 * 1000
let timeOfLastActivity = Date.now()

export const startActivityChecker = (): void => {
  audioElement.addEventListener('playing', updateActivity)
  audioElement.addEventListener('pause', updateActivity)
  audioElement.addEventListener('ended', updateActivity)
  audioElement.addEventListener('error', updateActivity)
  audioElement.addEventListener('timeupdate', updateActivity)
  setInterval(checkActivity, CHECK_INTERVAL)
}

const updateActivity = (): void => {
  timeOfLastActivity = Date.now()
}

const checkActivity = (): void => {
  if (Date.now() - timeOfLastActivity > MIN_IDLE_TIME) {
    destroyPlayer()
    killMe()
  }
}

const killMe = (): void => {
  const message: commonTypes.CloseOffscreenDocumentMessage = {
    target: commonTypes.MessageType.SERVICE_WORKER,
    type: 'close-offscreen-document'
  }
  void (chrome.runtime.sendMessage(message))
}
