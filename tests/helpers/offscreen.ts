import { commonTypes } from '@vk-audiopad/common'
import { type createChrome } from './chrome'

export const snapshot = (changes: Partial<commonTypes.PlayerSnapshot> = {}): commonTypes.PlayerSnapshot => ({
  documentId: 'document',
  activityRevision: 0,
  idle: false,
  playbackId: null,
  hasSource: false,
  requested: false,
  paused: true,
  playing: false,
  ended: false,
  failed: false,
  currentTime: 0,
  duration: 0,
  ...changes
})

export const answerSnapshots = (browser: ReturnType<typeof createChrome>, read: () => commonTypes.PlayerSnapshot | null | Promise<commonTypes.PlayerSnapshot | null> = snapshot) => {
  browser.api.runtime.onMessage.addListener(async (input: unknown) => {
    const message = input as commonTypes.Message
    if (message.target !== commonTypes.MessageTarget.OFFSCREEN || message.type !== commonTypes.MessageType.GET_PLAYER_SNAPSHOT) return
    const player = await read()
    if (player != null) await browser.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.PLAYER_SNAPSHOT, requestId: message.requestId, snapshot: player })
  })
}
