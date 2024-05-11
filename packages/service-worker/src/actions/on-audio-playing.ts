import { type commonTypes } from '@vk-audiopad/common'
import { fetchStartPlayback } from '../fetchers/start-playback'
import { applicationState } from '../state'
import { storage } from '../storage'
import { errorState } from './on-audio-error'

export const onPlaying = async (message: commonTypes.AudioPlayerPlayingMessage): Promise<void> => {
  errorState.counter = 0

  const [duration, currentTime] = [message.duration ?? 0, Math.floor(message.currentTime)]
  await storage.set({ played: true, duration, currentTime })

  const track = applicationState.activeTrack
  const deviceId = applicationState.deviceId
  setTimeout(async () => {
    if (track != null) {
      await fetchStartPlayback(track, deviceId)
    }
  }, 100)
}
