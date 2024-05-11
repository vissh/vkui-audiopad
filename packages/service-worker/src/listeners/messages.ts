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
import { updateCurrentTime } from '../offscreen/update-current-time'

export const startListeningMessages = (): void => {
  chrome.runtime.onMessage.addListener((message) => { void messageHandler(message) })
}

const messageHandler = async (message: commonTypes.Message): Promise<void> => {
  if (message.target !== commonTypes.MessageType.SERVICE_WORKER) {
    return
  }

  switch (message.type) {
    case 'active-track':
      await playNewTrack(message.trackId, message.playlist)
      break
    case 'next-track':
      await nextTrack()
      break
    case 'previous-track':
      await previousTrack()
      break
    case 'current-time':
      await updateCurrentTime(message.value ?? 0)
      break
    case 'repeat':
      await repeat()
      break
    case 'edit-current-playlist':
      editCurrentPlaylist(message.playlist, message.oldPlaylist, message.actions)
      break
    case 'delete-track':
      await deleteTrack(message.track)
      break
    case 'add-to-queue':
      await addToQueue(message.track)
      break
    case 'reload-track':
      await reloadTrack()
      break
    case 'audio-player-playing':
      await onPlaying(message)
      break
    case 'audio-player-pause':
      await onPause()
      break
    case 'audio-player-ended':
      await onEnded()
      break
    case 'audio-player-error':
      await onError()
      break
    case 'audio-player-timeupdate':
      await onTimeUpdate(message)
      break
    default:
      commonUtils.assertUnreachable(message)
  }
}
