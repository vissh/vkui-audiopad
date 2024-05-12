import { commonUtils, type commonTypes } from '@vk-audiopad/common'

export const sendMessage = async (message: commonTypes.ServiceWorkerMessage): Promise<void> => {
  if (await commonUtils.offscreenDocumentSupport()) {
    await chrome.runtime.sendMessage(message)
  } else {
    commonUtils.sendBackgroundMessage(message)
  }
}
