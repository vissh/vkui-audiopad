import { commonTypes } from '@vk-audiopad/common'
import { storage } from '../storage'
import { nextTrack } from './next'
import { playCurrentTrack } from './repeat'

export const onEnded = async (): Promise<void> => {
  await storage.played.set(false)
  const repeat = await storage.repeat.get()
  if (repeat === commonTypes.RepeatMode.REPEAT_ONE) {
    await playCurrentTrack()
    return
  }
  await nextTrack()
}
