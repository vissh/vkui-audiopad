import { type commonTypes } from '@vk-audiopad/common'
import { removeFromQueue } from '../queue'
import { mutateQueue } from '../queue-state'

export const deleteTrack = async (track: commonTypes.TrackItem): Promise<boolean> => {
  return await mutateQueue(state => removeFromQueue(state, track.id))
}
