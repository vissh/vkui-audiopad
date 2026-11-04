import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { beginOffscreenCommand, setupOffscreenDocument } from './setup'
import { requestPlayerSnapshot } from './player-snapshot'

export const sendOffscreenMessage = async (message: commonTypes.OffscreenMessage, isCurrent: () => boolean = () => true): Promise<void> => {
  const finish = beginOffscreenCommand()
  try {
    if (await commonUtils.offscreenDocumentSupport()) {
      await setupOffscreenDocument(isCurrent, async () => {
        await requestPlayerSnapshot(true, () => {}, { waitForReady: true, isCurrent })
        if (isCurrent()) await chrome.runtime.sendMessage(message)
      })
    } else {
      if (!isCurrent()) return
      await requestPlayerSnapshot(false, () => {}, { waitForReady: true, isCurrent })
      if (isCurrent()) commonUtils.sendBackgroundMessage(message)
    }
  } finally {
    finish()
  }
}
