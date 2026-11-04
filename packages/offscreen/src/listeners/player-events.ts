import { commonTypes } from '@vk-audiopad/common'
import { audioPlaybackId, listenToAudio } from '../audio-element'
import { sendMessage } from '../send-message'

let reportedError: string | null = null

export const reportPlayerError = (playbackId: string): void => {
  if (audioPlaybackId !== playbackId || reportedError === playbackId) return
  reportedError = playbackId
  void sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.AUDIO_PLAYER_ERROR, playbackId })
}

export const startListeningPlayerEvents = (): void => {
  listenToAudio((audio, playbackId) => {
    const handlers = {
      playing: () => {
        if (playbackId == null || audioPlaybackId !== playbackId) return
        void sendMessage({
          target: commonTypes.MessageTarget.SERVICE_WORKER,
          type: commonTypes.MessageType.AUDIO_PLAYER_PLAYING,
          playbackId,
          volume: audio.volume,
          duration: audio.duration,
          currentTime: audio.currentTime
        })
      },
      pause: () => {
        if (playbackId == null || audioPlaybackId !== playbackId) return
        void sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.AUDIO_PLAYER_PAUSE, playbackId })
      },
      ended: () => {
        if (playbackId == null || audioPlaybackId !== playbackId) return
        void sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.AUDIO_PLAYER_ENDED, playbackId })
      },
      error: () => { if (playbackId != null) reportPlayerError(playbackId) },
      timeupdate: () => {
        if (playbackId == null || audioPlaybackId !== playbackId) return
        void sendMessage({
          target: commonTypes.MessageTarget.SERVICE_WORKER,
          type: commonTypes.MessageType.AUDIO_PLAYER_TIMEUPDATED,
          playbackId,
          paused: audio.paused,
          duration: audio.duration,
          currentTime: audio.currentTime
        })
      }
    }
    Object.entries(handlers).forEach(([event, handler]) => { audio.addEventListener(event, handler) })
    return () => { Object.entries(handlers).forEach(([event, handler]) => { audio.removeEventListener(event, handler) }) }
  })
}
