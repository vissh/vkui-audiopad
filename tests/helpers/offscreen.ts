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

export const answerPlayerCommands = (browser: ReturnType<typeof createChrome>) => {
  browser.api.runtime.onMessage.addListener((input: unknown, _sender, respond) => {
    if (typeof input !== 'object' || input == null || !('requestId' in input) || typeof input.requestId !== 'string' || !('expiresAt' in input)) return
    const reply: commonTypes.CommandReply = { requestId: input.requestId, ok: true, outcome: 'handled' }
    respond(reply)
    return browser.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.COMMAND_REPLY, reply })
  })
}

export const answerSnapshots = (browser: ReturnType<typeof createChrome>, read: () => commonTypes.PlayerSnapshot | null | Promise<commonTypes.PlayerSnapshot | null> = snapshot) => {
  browser.api.runtime.onMessage.addListener((input: unknown) => {
    const message = input as commonTypes.Message
    if (message.target !== commonTypes.MessageTarget.OFFSCREEN || message.type !== commonTypes.MessageType.GET_PLAYER_SNAPSHOT) return
    return Promise.resolve(read()).then(async player => {
      if (player != null) await browser.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.PLAYER_SNAPSHOT, requestId: message.requestId, snapshot: player })
    })
  })
}
