import { commonTypes } from '@vk-audiopad/common'
import { sendOffscreenMessage } from './send-message'

export const updateVolume = async (value: number): Promise<void> => {
  await sendOffscreenMessage({
    target: commonTypes.MessageTarget.OFFSCREEN,
    type: commonTypes.MessageType.CHANGE_VOLUME,
    value
  })
}
