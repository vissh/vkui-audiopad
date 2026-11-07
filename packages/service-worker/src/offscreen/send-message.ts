import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { beginOffscreenCommand, setupOffscreenDocument } from './setup'
import { requestPlayerSnapshot } from './player-snapshot'

export const sendOffscreenMessage = async (message: commonTypes.OffscreenMessage | (() => commonTypes.OffscreenMessage | Promise<commonTypes.OffscreenMessage>), isCurrent: () => boolean = () => true): Promise<void> => {
  const payload = async (): Promise<commonTypes.OffscreenMessage> => typeof message === 'function' ? message() : message
  const finish = beginOffscreenCommand()
  try {
    if (await commonUtils.offscreenDocumentSupport()) {
      await setupOffscreenDocument(isCurrent, async () => {
        await requestPlayerSnapshot(true, () => {}, { waitForReady: true, isCurrent })
        if (!isCurrent()) return
        const prepared = await payload()
        if (isCurrent()) await chrome.runtime.sendMessage(prepared)
      })
    } else {
      if (!isCurrent()) return
      await requestPlayerSnapshot(false, () => {}, { waitForReady: true, isCurrent })
      if (!isCurrent()) return
      const prepared = await payload()
      if (isCurrent()) commonUtils.sendBackgroundMessage(prepared)
    }
  } finally {
    finish()
  }
}
