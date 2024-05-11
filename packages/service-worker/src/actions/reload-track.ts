import { applicationState } from '../state'
import { playNewTrack } from './play-new-track'

export const reloadTrack = async (): Promise<void> => {
  if ((applicationState.currentPlaylist == null) || (applicationState.activeTrack == null)) {
    return
  }

  await playNewTrack(applicationState.activeTrack.id, applicationState.currentPlaylist)
}
