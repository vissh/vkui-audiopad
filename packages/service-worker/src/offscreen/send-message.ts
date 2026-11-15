import { commonUtils, commandClient, messageValidation, type commonTypes } from '@vk-audiopad/common'
import { beginOffscreenCommand, setupOffscreenDocument } from './setup'
import { requestPlayerSnapshot } from './player-snapshot'

export const sendOffscreenMessage = async (message: commonTypes.OffscreenMessage | (() => commonTypes.OffscreenMessage | Promise<commonTypes.OffscreenMessage>), isCurrent: () => boolean = () => true): Promise<void> => {
  const payload = async (): Promise<commonTypes.OffscreenMessage> => typeof message === 'function' ? message() : message
  const deliver = async (prepared: commonTypes.OffscreenMessage, background: boolean): Promise<void> => {
    if (!messageValidation.isPlayerCommand(prepared)) throw new Error('Invalid player command')
    const reply = await commandClient.requestCommand(prepared, background)
    if (!reply.ok) throw new Error('Player command unavailable')
  }
  const finish = beginOffscreenCommand()
  try {
    if (await commonUtils.offscreenDocumentSupport()) {
      await setupOffscreenDocument(isCurrent, async () => {
        await requestPlayerSnapshot(true, () => {}, { waitForReady: true, isCurrent })
        if (!isCurrent()) return
        const prepared = await payload()
        if (isCurrent()) await deliver(prepared, false)
      })
    } else {
      if (!isCurrent()) return
      await requestPlayerSnapshot(false, () => {}, { waitForReady: true, isCurrent })
      if (!isCurrent()) return
      const prepared = await payload()
      if (isCurrent()) await deliver(prepared, true)
    }
  } finally {
    finish()
  }
}
