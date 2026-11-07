import { type commonTypes } from '@vk-audiopad/common'
import { fetchQueueParams } from '../fetchers/queue-params'
import { fetchStartPlayback } from '../fetchers/start-playback'
import { applicationState } from '../state'
import { commitPlayback, getPlaybackOperation, isCurrentPlayer } from '../playback-operation'

export const onPlaying = async (message: commonTypes.AudioPlayerPlayingMessage): Promise<void> => {
  const [duration, currentTime] = [message.duration ?? 0, Math.floor(message.currentTime)]
  if (!await commitPlayback(() => isCurrentPlayer(message.playbackId), { played: true, duration, currentTime })) return

  const operation = getPlaybackOperation()
  if (operation?.playbackId === message.playbackId && operation.trackId != null && isCurrentPlayer(message.playbackId)) {
    operation.attempts = 1
    operation.visited = new Set([operation.trackId])
    operation.trackAttempts = new Map([[operation.trackId, 1]])
  }

  const track = applicationState.activeTrack
  const deviceId = applicationState.deviceId
  setTimeout(() => {
    if (track != null && isCurrentPlayer(message.playbackId)) {
      void fetchQueueParams(track).then(async () => {
        if (isCurrentPlayer(message.playbackId)) await fetchStartPlayback(track, deviceId)
      }).catch(() => {
        console.warn('Playback notification could not be delivered')
      })
    }
  }, 100)
}
