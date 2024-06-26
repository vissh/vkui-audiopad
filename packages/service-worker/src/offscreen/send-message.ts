import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { setupOffscreenDocument } from './setup'

export const sendOffscreenMessage = async (message: commonTypes.OffscreenMessage): Promise<void> => {
  if (await commonUtils.offscreenDocumentSupport()) {
    await setupOffscreenDocument()
    await chrome.runtime.sendMessage(message)
  } else {
    commonUtils.sendBackgroundMessage(message)
  }
}
