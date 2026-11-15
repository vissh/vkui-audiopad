import { commonTypes, commonUtils, messageValidation, sessionClient } from '@vk-audiopad/common'
import { serializeError } from 'serialize-error'
import { addToQueue } from '../actions/add-to-queue'
import { deleteTrack } from '../actions/delete-track'
import { editCurrentPlaylist } from '../actions/edit-current-playlist'
import { appendCurrentPlaylist } from '../actions/append-current-playlist'
import { nextTrack, previousTrack } from '../actions/next'
import { onEnded } from '../actions/on-audio-ended'
import { onError } from '../actions/on-audio-error'
import { onPause } from '../actions/on-audio-pause'
import { onPlaying } from '../actions/on-audio-playing'
import { onTimeUpdate } from '../actions/on-audio-timeupdate'
import { playNewTrack } from '../actions/play-new-track'
import { reloadTrack } from '../actions/reload-track'
import { repeat } from '../actions/repeat'
import { toggleShuffle } from '../actions/shuffle'
import { closeOffscreenDocument } from '../offscreen/setup'
import { updateEqualizer } from '../offscreen/update-equalizer'
import { updateCurrentTime } from '../offscreen/update-current-time'
import { isCurrentPlayer } from '../playback-operation'
import { onPlayed, togglePlayback } from '../actions/play-or-pause'
import { type Readiness } from '../readiness'
import { applicationState } from '../state'

const mediaMessages = new Set([
  commonTypes.MessageType.AUDIO_PLAYER_PLAYING,
  commonTypes.MessageType.AUDIO_PLAYER_PAUSE,
  commonTypes.MessageType.AUDIO_PLAYER_ENDED,
  commonTypes.MessageType.AUDIO_PLAYER_ERROR,
  commonTypes.MessageType.AUDIO_PLAYER_TIMEUPDATED
])

export const startListeningMessages = async (readiness: Readiness, offscreen: boolean): Promise<void> => {
  const receive = (message: unknown, respond?: (reply: commonTypes.CommandReply) => void): boolean | undefined => {
    if (!sessionClient.isObject(message) || message.target !== commonTypes.MessageTarget.SERVICE_WORKER || message.type === commonTypes.MessageType.PLAYER_SNAPSHOT || message.type === commonTypes.MessageType.SESSION_REQUEST || message.type === commonTypes.MessageType.SESSION_CANCEL || message.type === commonTypes.MessageType.COMMAND_REPLY) return
    const requestId = typeof message.requestId === 'string' && message.requestId.length > 0 && message.requestId.length <= 100 ? message.requestId : ''
    const fail = (): void => { respond?.({ requestId, ok: false, error: serializeError(new Error('Command could not be applied')) }) }
    if (!messageValidation.isRuntimeMessage(message)) { if (requestId !== '') fail(); return }
    if (requestId !== '' && messageValidation.isPlayerCommand(message)) {
      const expiresAt = 'expiresAt' in message ? message.expiresAt : undefined
      if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt) || expiresAt < Date.now() || expiresAt > Date.now() + 31_000) { fail(); return }
      const identity = chrome.storage.local.get(['userId', 'sessionEpoch']).then(value => ({ value }), () => ({ value: null }))
      void readiness.execute(async () => {
        const outcome = await messageHandler(message)
        respond?.({ requestId, ok: true, outcome: outcome === undefined ? 'handled' : outcome ? 'applied' : 'ignored' })
      }, async () => {
        await commonUtils.withTimeout(async () => {
          const { value: before } = await identity
          const now = await chrome.storage.local.get(['userId', 'sessionEpoch'])
          if (before == null || Date.now() >= expiresAt || before.userId !== now.userId || before.sessionEpoch !== now.sessionEpoch) throw new Error('Command retired')
        }, Math.max(1, expiresAt - Date.now()))
      }).catch(fail)
      return true
    }
    if (mediaMessages.has(message.type) && !readiness.acceptsMedia()) return
    readiness.run(async () => { await messageHandler(message) })
    return undefined
  }
  chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
    if (!messageValidation.isTrustedSender(sender)) return
    return receive(message, reply => { try { respond(reply) } catch {} })
  })
  if (!offscreen) {
    commonUtils.addBackgroundMessageListener(message => {
      receive(message, reply => { commonUtils.sendBackgroundMessage({ target: commonTypes.MessageTarget.OFFSCREEN, type: commonTypes.MessageType.COMMAND_REPLY, reply }) })
    })
  }
}

const messageHandler = async (message: commonTypes.Message): Promise<boolean | undefined> => {
  if (message.target !== commonTypes.MessageTarget.SERVICE_WORKER || message.type === commonTypes.MessageType.COMMAND_REPLY) {
    return
  }

  switch (message.type) {
    case commonTypes.MessageType.PLAY_OR_PAUSE:
      await onPlayed(message.played)
      break
    case commonTypes.MessageType.TOGGLE_PLAYBACK:
      await togglePlayback()
      break
    case commonTypes.MessageType.ACTIVE_TRACK:
      await playNewTrack(message.trackId, message.playlist)
      break
    case commonTypes.MessageType.NEXT_TRACK:
      await nextTrack()
      break
    case commonTypes.MessageType.PREVIOUS_TRACK:
      await previousTrack()
      break
    case commonTypes.MessageType.CURRENT_TIME:
      await updateCurrentTime(message.value ?? 0)
      break
    case commonTypes.MessageType.TOGGLE_SHUFFLE:
      await toggleShuffle()
      break
    case commonTypes.MessageType.REPEAT:
      await repeat()
      break
    case commonTypes.MessageType.EDIT_CURRENT_PLAYLIST:
      return await editCurrentPlaylist(message.playlist, message.oldPlaylist, message.actions)
    case commonTypes.MessageType.APPEND_CURRENT_PLAYLIST:
      return await appendCurrentPlaylist(message.basePlaylist, message.playlist)
    case commonTypes.MessageType.DELETE_TRACK:
      return await deleteTrack(message.track)
    case commonTypes.MessageType.ADD_TO_QUEUE:
      return await addToQueue(message.track)
    case commonTypes.MessageType.RELOAD_TRACK:
      await reloadTrack()
      break
    case commonTypes.MessageType.AUDIO_PLAYER_PLAYING:
      if (isCurrentPlayer(message.playbackId)) await onPlaying(message)
      break
    case commonTypes.MessageType.AUDIO_PLAYER_PAUSE:
      if (isCurrentPlayer(message.playbackId)) await onPause(message.playbackId)
      break
    case commonTypes.MessageType.AUDIO_PLAYER_ENDED:
      if (isCurrentPlayer(message.playbackId)) await onEnded(message.playbackId)
      break
    case commonTypes.MessageType.AUDIO_PLAYER_ERROR:
      if (isCurrentPlayer(message.playbackId)) await onError(message.playbackId)
      break
    case commonTypes.MessageType.AUDIO_PLAYER_TIMEUPDATED:
      if (isCurrentPlayer(message.playbackId)) await onTimeUpdate(message)
      break
    case commonTypes.MessageType.PLAYER_SNAPSHOT:
    case commonTypes.MessageType.SESSION_REQUEST:
    case commonTypes.MessageType.SESSION_CANCEL:
      break
    case commonTypes.MessageType.RETRY_EQUALIZER:
      await updateEqualizer(applicationState.equalizer, true)
      break
    case commonTypes.MessageType.EQUALIZER_STATUS:
      if (message.playbackId === applicationState.playbackId) {
        await chrome.storage.local.set({ equalizerStatus: message.status })
      }
      break
    case commonTypes.MessageType.CLOSE_OFFSCREEN_DOCUMENT:
      await closeOffscreenDocument(message)
      break
    default:
      commonUtils.assertUnreachable(message)
  }
  return undefined
}
