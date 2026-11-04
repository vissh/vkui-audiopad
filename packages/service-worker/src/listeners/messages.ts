import { commonTypes, commonUtils } from '@vk-audiopad/common'
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
import { closeOffscreenDocument } from '../offscreen/setup'
import { updateCurrentTime } from '../offscreen/update-current-time'
import { isCurrentPlayer } from '../playback-operation'
import { onPlayed, togglePlayback } from '../actions/play-or-pause'
import { type Readiness } from '../readiness'

const mediaMessages = new Set([
  commonTypes.MessageType.AUDIO_PLAYER_PLAYING,
  commonTypes.MessageType.AUDIO_PLAYER_PAUSE,
  commonTypes.MessageType.AUDIO_PLAYER_ENDED,
  commonTypes.MessageType.AUDIO_PLAYER_ERROR,
  commonTypes.MessageType.AUDIO_PLAYER_TIMEUPDATED
])

export const startListeningMessages = async (readiness: Readiness, offscreen: boolean): Promise<void> => {
  const receive = (message: commonTypes.Message): void => {
    if (message.target !== commonTypes.MessageTarget.SERVICE_WORKER || message.type === commonTypes.MessageType.PLAYER_SNAPSHOT) return
    if (mediaMessages.has(message.type) && !readiness.acceptsMedia()) return
    readiness.run(async () => { await messageHandler(message) })
  }
  chrome.runtime.onMessage.addListener(receive)
  if (!offscreen) {
    commonUtils.addBackgroundMessageListener(receive)
  }
}

const messageHandler = async (message: commonTypes.Message): Promise<void> => {
  if (message.target !== commonTypes.MessageTarget.SERVICE_WORKER) {
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
    case commonTypes.MessageType.REPEAT:
      await repeat()
      break
    case commonTypes.MessageType.EDIT_CURRENT_PLAYLIST:
      await editCurrentPlaylist(message.playlist, message.oldPlaylist, message.actions)
      break
    case commonTypes.MessageType.APPEND_CURRENT_PLAYLIST:
      await appendCurrentPlaylist(message.basePlaylist, message.playlist)
      break
    case commonTypes.MessageType.DELETE_TRACK:
      await deleteTrack(message.track)
      break
    case commonTypes.MessageType.ADD_TO_QUEUE:
      await addToQueue(message.track)
      break
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
      break
    case commonTypes.MessageType.CLOSE_OFFSCREEN_DOCUMENT:
      await closeOffscreenDocument(message)
      break
    default:
      commonUtils.assertUnreachable(message)
  }
}
