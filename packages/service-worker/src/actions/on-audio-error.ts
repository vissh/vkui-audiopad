import { commitPlayback, getPlaybackOperation, isCurrentPlayer, isRunningPlayback, MAX_PLAYBACK_ATTEMPTS, restorePlayback, waitForPlayback } from '../playback-operation'
import { playbackFailureMessage, playNewTrack, stopPlayback } from './play-new-track'

export const onError = async (playbackId: string): Promise<void> => {
  if (!isCurrentPlayer(playbackId)) return
  const operation = getPlaybackOperation() ?? restorePlayback(playbackId)
  if (operation == null) return
  operation.retryPending = true
  operation.launched = false
  operation.loading = true
  if (!await commitPlayback(() => isRunningPlayback(operation), { played: false })) return
  if (operation.attempts >= MAX_PLAYBACK_ATTEMPTS) {
    await stopPlayback(operation, playbackFailureMessage(operation))
    return
  }
  if (!await waitForPlayback(operation, 300)) return
  operation.retryPending = false
  await playNewTrack(operation.trackId, operation.playlist, operation)
}
