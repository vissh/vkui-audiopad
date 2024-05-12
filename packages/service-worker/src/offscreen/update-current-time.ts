import { commonTypes } from '@vk-audiopad/common'
import { sendOffscreenMessage } from './send-message'

export const updateCurrentTime = async (value: number): Promise<void> => {
  await sendOffscreenMessage({
    target: commonTypes.MessageTarget.OFFSCREEN,
    type: commonTypes.MessageType.CHANGE_CURRENT_TIME,
    value
  })
}
