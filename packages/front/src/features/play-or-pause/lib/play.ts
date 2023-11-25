import { type commonTypes } from '@vk-audiopad/common'
import { setPlayed } from '@/entities/active-track'
import { type TrackState } from '@/entities/track'
import { sendMessage } from '@/shared/lib/send-message'

export const playOrPause = (
  trackState: TrackState,
  trackIndex: number,
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

  sendMessage({ type: 'active-track', trackIndex, playlist })
}
