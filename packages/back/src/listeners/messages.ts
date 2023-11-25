import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { addToQueue } from '../actions/add-to-queue'
import { deleteTrack } from '../actions/delete-track'
import { editCurrentPlaylist } from '../actions/edit-current-playlist'
import { nextTrack, previousTrack } from '../actions/next'
import { playNewTrack } from '../actions/play-new-track'
import { repeat } from '../actions/repeat'
import { audioElement } from '../player'

export const startListeningPopupMessages = (): void => {
  // Действия, которые приходит из popup'а.
  chrome.runtime.onMessage.addListener((message) => { void messageHandler(message) })
}

const messageHandler = async (message: commonTypes.Messages): Promise<void> => {
  switch (message.type) {
    case 'active-track':
      await playNewTrack(message.trackIndex, message.playlist, true)
      break
    case 'next-track':
      await nextTrack()
      break
    case 'previous-track':
      await previousTrack()
      break
    case 'current-time':
      audioElement.currentTime = message.value ?? 0
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
    default:
      commonUtils.assertUnreachable(message)
  }
}
