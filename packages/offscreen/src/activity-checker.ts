import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { audioElement } from './audio-element'
import { destroyPlayer } from './handlers/play-track'
import { sendMessage } from './send-message'

const MIN_IDLE_TIME = 5 * 60 * 1000
const CHECK_INTERVAL = 1 * 60 * 1000

let timeOfLastActivity = Date.now()
let intervalId = 0

export const startActivityChecker = (): void => {
  audioElement.addEventListener('playing', updateActivity)
  audioElement.addEventListener('pause', updateActivity)
  audioElement.addEventListener('ended', updateActivity)
  audioElement.addEventListener('error', updateActivity)
  audioElement.addEventListener('timeupdate', updateActivity)
  intervalId = setInterval(checkActivity, CHECK_INTERVAL)
}

const updateActivity = (): void => {
  timeOfLastActivity = Date.now()
}

const checkActivity = async (): Promise<void> => {
  if (!await commonUtils.offscreenDocumentSupport()) {
    clearInterval(intervalId)
    return
  }

  if (Date.now() - timeOfLastActivity > MIN_IDLE_TIME) {
    destroyPlayer()
    killMe()
  }
}

const killMe = (): void => {
  void (sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.CLOSE_OFFSCREEN_DOCUMENT
  }))
}
