import { playOrPause } from '../offscreen/play-or-pause'
import { isOffscreenClosing } from '../offscreen/setup'
import { cancelPlayback, commitPlayback, getPlaybackOperation, getRequestedPlayback, requestPlayback, restorePlayback } from '../playback-operation'
import { applicationState } from '../state'
import { playNewTrack } from './play-new-track'
import { reloadTrack } from './reload-track'
import { hydrateQueue } from './hydrate-queue'

export const togglePlayback = async (): Promise<void> => {
  await onPlayed(!getRequestedPlayback())
}

export const onPlayed = async (played: boolean): Promise<void> => {
  const pending = getPlaybackOperation()
  const ownsIntent = requestPlayback(played)
  if (!played) {
    cancelPlayback()
    void chrome.action.setBadgeText({ text: '' })
  }
  if (played && pending != null && !pending.launched) {
    await playNewTrack(pending.trackId, pending.playlist)
    return
  }
  if (played && (isOffscreenClosing() || applicationState.playbackId == null || applicationState.playbackError != null)) {
    if (applicationState.currentPlaylist != null && applicationState.activeTrack != null) {
      await reloadTrack()
    } else {
      const ownsEmptyIntent = requestPlayback(false)
      await commitPlayback(ownsEmptyIntent, { playbackRequested: false })
    }
    return
  }
  if (played && applicationState.playbackId != null) restorePlayback(applicationState.playbackId)
  const operation = getPlaybackOperation()
  const isCurrent = (): boolean => ownsIntent() && getPlaybackOperation() === operation
  if (!await commitPlayback(isCurrent, played ? { playbackRequested: true } : { playbackRequested: false, played: false })) return
  await playOrPause(played, isCurrent)
  if (played && isCurrent() && operation != null) await hydrateQueue(operation)
}
