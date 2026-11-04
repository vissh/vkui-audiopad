import { commonTypes } from '@vk-audiopad/common'
import { storage } from '../storage'
import { nextTrack } from './next'
import { playCurrentTrack } from './repeat'
import { commitPlayback, isCurrentPlayer } from '../playback-operation'

export const onEnded = async (playbackId: string): Promise<void> => {
  if (!await commitPlayback(() => isCurrentPlayer(playbackId), { played: false })) return
  const repeat = await storage.repeat.get()
  if (!isCurrentPlayer(playbackId)) return
  if (repeat === commonTypes.RepeatMode.REPEAT_ONE) {
    await playCurrentTrack()
    return
  }
  await nextTrack()
}
