import { type commonTypes } from '@vk-audiopad/common'
import { insertNext } from '../queue'
import { mutateQueue } from '../queue-state'

export const addToQueue = async (track: commonTypes.TrackItem): Promise<void> => {
  await mutateQueue(state => insertNext(state, track))
}
