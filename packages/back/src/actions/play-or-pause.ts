import { audioElement, destroyPlayer } from '../player'
import { applicationState } from '../state'
import { playNewTrack } from './play-new-track'

export const onPlayed = async (played: boolean | undefined): Promise<void> => {
  if (played == null) {
    destroyPlayer()
    void chrome.browserAction.setBadgeText({ text: '' })
    return
  }

  if (!played) {
    (audioElement.src.length > 0) && audioElement.pause()
    void chrome.browserAction.setBadgeText({ text: '' })
    return
  }

  if (audioElement.src.length > 0) {
    void audioElement.play()
    return
  }

  await reloadTrack()
}

const reloadTrack = async (): Promise<void> => {
  if ((applicationState.currentPlaylist == null) || (applicationState.activeTrack == null)) {
    return
  }

  await playNewTrack(applicationState.activeTrackIndex, applicationState.currentPlaylist)
}
