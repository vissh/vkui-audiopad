import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { listenToAudio } from './audio-element'
import { noteActivity } from './activity'
import { getPlayerSnapshot } from './player-snapshot'
import { sendMessage } from './send-message'

const CHECK_INTERVAL = 1 * 60 * 1000

let intervalId: ReturnType<typeof setInterval> | undefined

export const startActivityChecker = (): void => {
  listenToAudio(audio => {
    noteActivity()
    const events = ['playing', 'pause', 'ended', 'error', 'timeupdate']
    events.forEach(event => { audio.addEventListener(event, noteActivity) })
    return () => { events.forEach(event => { audio.removeEventListener(event, noteActivity) }) }
  })
  intervalId = setInterval(() => { void checkActivity().catch(() => { console.warn('Idle cleanup request failed') }) }, CHECK_INTERVAL)
}

const checkActivity = async (): Promise<void> => {
  if (!await commonUtils.offscreenDocumentSupport()) {
    clearInterval(intervalId)
    return
  }

  const player = getPlayerSnapshot()
  if (player.idle && player.paused && !player.requested) {
    await sendMessage({
      target: commonTypes.MessageTarget.SERVICE_WORKER,
      type: commonTypes.MessageType.CLOSE_OFFSCREEN_DOCUMENT,
      documentId: player.documentId,
      playbackId: player.playbackId,
      activityRevision: player.activityRevision
    })
  }
}
