import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'
import { storage } from '../storage'
import { setBadgeText } from '../utils'

let previousDuration = 0
let previousTime = 0

export const onTimeUpdate = async (message: commonTypes.AudioPlayerTimeupdateMessage): Promise<void> => {
  const duration = message.duration ?? 0
  const currentTime = Math.floor(message.currentTime)

  if (previousDuration === duration && previousTime === currentTime) {
    return
  }

  previousDuration = duration
  previousTime = currentTime

  await storage.set({ duration, currentTime })

  if (message.paused) {
    return
  }

  if (commonUtils.isFirefox()) {
    void chrome.action.setBadgeText({ text: '►' })
    return
  }

  setBadgeText(applicationState.durationMode, duration, currentTime)
}
