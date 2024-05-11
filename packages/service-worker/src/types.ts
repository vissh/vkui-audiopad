import { type commonTypes } from '@vk-audiopad/common'

export type ActionType = 'next' | 'prev'

export interface TListenedData {
  userId: string
  track: commonTypes.TrackItem
  listened: number
  endStreamReason: commonTypes.EndOfStreamReason
}
