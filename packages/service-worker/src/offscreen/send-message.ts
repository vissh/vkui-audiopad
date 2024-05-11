import { type commonTypes } from '@vk-audiopad/common'
import { setupOffscreenDocument } from './setup'

export const sendOffscreenMessage = async (message: commonTypes.OffscreenMessage): Promise<void> => {
  await setupOffscreenDocument()
  await chrome.runtime.sendMessage(message)
}
