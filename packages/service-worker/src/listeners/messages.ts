import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { addToQueue } from '../actions/add-to-queue'
import { deleteTrack } from '../actions/delete-track'
import { editCurrentPlaylist } from '../actions/edit-current-playlist'
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

export const startListeningMessages = async (): Promise<void> => {
  chrome.runtime.onMessage.addListener(messageHandler)

  if (!await commonUtils.offscreenDocumentSupport()) {
    commonUtils.addBackgroundMessageListener(messageHandler)
  }
}

const messageHandler = (message: commonTypes.Message): void => {
  if (message.target !== commonTypes.MessageTarget.SERVICE_WORKER) {
    return
  }

  switch (message.type) {
    case commonTypes.MessageType.ACTIVE_TRACK:
      void playNewTrack(message.trackId, message.playlist)
      break
    case commonTypes.MessageType.NEXT_TRACK:
      void nextTrack()
      break
    case commonTypes.MessageType.PREVIOUS_TRACK:
      void previousTrack()
      break
    case commonTypes.MessageType.CURRENT_TIME:
      void updateCurrentTime(message.value ?? 0)
      break
    case commonTypes.MessageType.REPEAT:
      void repeat()
      break
    case commonTypes.MessageType.EDIT_CURRENT_PLAYLIST:
      editCurrentPlaylist(message.playlist, message.oldPlaylist, message.actions)
      break
    case commonTypes.MessageType.DELETE_TRACK:
      void deleteTrack(message.track)
      break
    case commonTypes.MessageType.ADD_TO_QUEUE:
      void addToQueue(message.track)
      break
    case commonTypes.MessageType.RELOAD_TRACK:
      void reloadTrack()
      break
    case commonTypes.MessageType.AUDIO_PLAYER_PLAYING:
      void onPlaying(message)
      break
    case commonTypes.MessageType.AUDIO_PLAYER_PAUSE:
      void onPause()
      break
    case commonTypes.MessageType.AUDIO_PLAYER_ENDED:
      void onEnded()
      break
    case commonTypes.MessageType.AUDIO_PLAYER_ERROR:
      void onError()
      break
    case commonTypes.MessageType.AUDIO_PLAYER_TIMEUPDATED:
      void onTimeUpdate(message)
      break
    case commonTypes.MessageType.CLOSE_OFFSCREEN_DOCUMENT:
      void closeOffscreenDocument()
      break
    default:
      commonUtils.assertUnreachable(message)
  }
}
