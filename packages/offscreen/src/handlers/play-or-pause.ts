import { commonTypes } from '@vk-audiopad/common'
import { audioElement, audioPlaybackId, audioRequestRevision, setAudioPlaybackRequested } from '../audio-element'
import { sendMessage } from '../send-message'
import { reportPlayerError } from '../listeners/player-events'
import { isEqualizerPreparing, resumeEqualizer } from '../equalizer'

export const playOrPause = (played: boolean): void => {
  setAudioPlaybackRequested(played)
  if (isEqualizerPreparing()) {
    if (!played) audioElement.pause()
    return
  }
  if (audioElement.src.length > 0) {
    if (played) {
      resumeEqualizer()
      const playbackId = audioPlaybackId
      const revision = audioRequestRevision
      void audioElement.play().catch(() => { if (playbackId != null && revision === audioRequestRevision) reportPlayerError(playbackId) })
    } else {
      audioElement.pause()
    }
  } else if (played) {
    void sendMessage({
      target: commonTypes.MessageTarget.SERVICE_WORKER,
      type: commonTypes.MessageType.RELOAD_TRACK
    })
  }
}
