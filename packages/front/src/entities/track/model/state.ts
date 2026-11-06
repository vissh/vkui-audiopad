import { commonTypes } from '@vk-audiopad/common'
import { type TrackState } from './types'

export const getTrackState = (track: commonTypes.TrackItem, activeTrack: commonTypes.TrackItem | null, played: boolean): TrackState => {
  if ((track.flags & commonTypes.TrackFlagBit.CLAIMED) !== 0) return 'disabled'
  if (activeTrack?.id !== track.id) return 'normal'
  return played ? 'played' : 'paused'
}
