import { commonTypes } from '@vk-audiopad/common'
import { type TrackState } from '@/entities/track'
import { sendMessage } from '@/shared/lib/send-message'

export const playOrPause = (
  trackState: TrackState,
  trackId: string | null,
  playlist: commonTypes.Playlist
) => {
  if (trackState === 'played' || trackState === 'paused') {
    sendMessage({
      target: commonTypes.MessageTarget.SERVICE_WORKER,
      type: commonTypes.MessageType.TOGGLE_PLAYBACK
    })
    return
  }

  sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.ACTIVE_TRACK,
    trackId,
    playlist
  })
}
