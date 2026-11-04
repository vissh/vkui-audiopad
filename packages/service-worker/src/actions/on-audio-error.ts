import { getPlaybackOperation, isCurrentPlayer, MAX_PLAYBACK_ATTEMPTS, restorePlayback, waitForPlayback } from '../playback-operation'
import { nextTrack } from './next'
import { stopPlayback } from './play-new-track'

export const onError = async (playbackId: string): Promise<void> => {
  if (!isCurrentPlayer(playbackId)) return
  const operation = getPlaybackOperation() ?? restorePlayback(playbackId)
  if (operation == null) return
  operation.retryPending = true
  if (operation.attempts >= MAX_PLAYBACK_ATTEMPTS) {
    await stopPlayback(operation, 'Воспроизведение остановлено после ошибок. Выберите другой трек или повторите попытку.')
    return
  }
  if (!await waitForPlayback(operation, 300)) return
  operation.retryPending = false
  await nextTrack(operation)
}
