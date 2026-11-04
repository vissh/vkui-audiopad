import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { applicationState } from '../state'
import { commitPlayback, isCurrentPlayer } from '../playback-operation'
import { setBadgeText } from '../utils'

let previousDuration = 0
let previousTime = 0
let previousPlaybackId: string | null = null

export const onTimeUpdate = async (message: commonTypes.AudioPlayerTimeupdateMessage): Promise<void> => {
  if (!isCurrentPlayer(message.playbackId)) return
  const duration = message.duration ?? 0
  const currentTime = Math.floor(message.currentTime)

  if (previousPlaybackId === message.playbackId && previousDuration === duration && previousTime === currentTime) {
    return
  }

  previousDuration = duration
  previousTime = currentTime
  previousPlaybackId = message.playbackId

  if (!await commitPlayback(() => isCurrentPlayer(message.playbackId), { duration, currentTime })) return

  if (message.paused) {
    return
  }

  if (commonUtils.isFirefox()) {
    void chrome.action.setBadgeText({ text: '►' })
    return
  }

  setBadgeText(applicationState.durationMode, duration, currentTime)
}
