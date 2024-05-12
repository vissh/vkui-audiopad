import { commonTypes } from '@vk-audiopad/common'
import { sendOffscreenMessage } from './send-message'

export const playOrPause = async (played: boolean): Promise<void> => {
  await sendOffscreenMessage({
    target: commonTypes.MessageTarget.OFFSCREEN,
    type: commonTypes.MessageType.PLAY_OR_PAUSE,
    played
  })
}
