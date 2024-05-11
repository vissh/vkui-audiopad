import { commonTypes } from '@vk-audiopad/common'
import { setPlayed } from '@/entities/active-track'
import { type TrackState } from '@/entities/track'
import { sendMessage } from '@/shared/lib/send-message'

export const playOrPause = (
  trackState: TrackState,
  trackId: string | null,
  playlist: commonTypes.Playlist
) => {
  if (trackState === 'played') {
    setPlayed(false)
    return
  }

  if (trackState === 'paused') {
    setPlayed(true)
    return
  }

  sendMessage({
    target: commonTypes.MessageType.SERVICE_WORKER,
    type: 'active-track',
    trackId,
    playlist
  })
}
