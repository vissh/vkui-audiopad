import { commonTypes } from '@vk-audiopad/common'
import { nextTrack } from './next'
import { playCurrentTrack } from './repeat'
import { storage } from '../storage'

export const onEnded = async (): Promise<void> => {
  await storage.played.set(false)
  const repeat = await storage.repeat.get()
  if (repeat === commonTypes.RepeatMode.REPEAT_ONE) {
    await playCurrentTrack(); return
  }
  await nextTrack()
}
