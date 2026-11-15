import { commonTypes, commonUtils, messageValidation, sessionClient, commandClient } from '@vk-audiopad/common'
import { changeCurrentTime } from '../handlers/change-current-time'
import { changeVolume } from '../handlers/change-volume'
import { playOrPause } from '../handlers/play-or-pause'
import { playTrack } from '../handlers/play-track'
import { getPlayerSnapshot } from '../player-snapshot'
import { sendMessage } from '../send-message'
import { noteActivity } from '../activity'
import { changeEqualizer } from '../equalizer'
import { reportPlayerError } from './player-events'

export const startListeningMessages = (): void => {
  const receive = (message: unknown, respond?: (reply: commonTypes.CommandReply) => void): boolean | undefined => {
    if (!sessionClient.isObject(message) || message.target !== commonTypes.MessageTarget.OFFSCREEN || message.type === commonTypes.MessageType.COMMAND_REPLY) return
    const requestId = typeof message.requestId === 'string' && message.requestId.length > 0 && message.requestId.length <= 100 ? message.requestId : ''
    const fail = (): void => { respond?.(commandClient.failedReply(requestId)) }
    if (!messageValidation.isRuntimeMessage(message)) { if (requestId !== '') fail(); return }
    const request = requestId !== '' && messageValidation.isPlayerCommand(message)
    if (request && (typeof message.expiresAt !== 'number' || !Number.isFinite(message.expiresAt) || message.expiresAt < Date.now() || message.expiresAt > Date.now() + 31_000)) { fail(); return }
    void messageHandler(message).then(() => {
      if (request) respond?.({ requestId, ok: true, outcome: 'handled' })
    }).catch(() => {
      if (request) fail()
      else console.warn('Player command failed')
    })
    return request ? true : undefined
  }
  chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
    if (!messageValidation.isTrustedSender(sender)) return
    return receive(message, reply => { try { respond(reply) } catch {} })
  })
  commonUtils.addBackgroundMessageListener(message => {
    receive(message, reply => { commonUtils.sendBackgroundMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.COMMAND_REPLY, reply }) })
  })
}

const messageHandler = async (message: commonTypes.Message): Promise<void> => {
  if (message.target !== commonTypes.MessageTarget.OFFSCREEN || message.type === commonTypes.MessageType.COMMAND_REPLY) {
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
      changeEqualizer(message.equalizer, false, message.equalizerMixAccess === true)
      void playTrack(message.url, message.volume, message.playbackId).catch(() => { reportPlayerError(message.playbackId) })
      break
    case commonTypes.MessageType.CHANGE_EQUALIZER:
      changeEqualizer(message.value, message.retry === true, message.equalizerMixAccess === true)
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
