import { commonTypes } from '@vk-audiopad/common'
import { sendOffscreenMessage } from './send-message'

export const playTrack = async (url: string, volume: number): Promise<void> => {
  await sendOffscreenMessage({
    target: commonTypes.MessageType.OFFSCREEN,
    type: 'play-track',
    url,
    volume
  })
}
