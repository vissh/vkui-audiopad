import { commonTypes, commonUtils, equalizer } from '@vk-audiopad/common'
import { sendOffscreenMessage } from './send-message'
import { equalizerMixAccess } from './equalizer-mix-access'

let revision = 0

export const updateEqualizer = async (value: unknown, retry = false): Promise<void> => {
  const current = ++revision
  if (await commonUtils.offscreenDocumentSupport()) {
    const contexts = await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT] })
    if (contexts.length === 0) return
  }
  await sendOffscreenMessage(async () => ({
    target: commonTypes.MessageTarget.OFFSCREEN,
    type: commonTypes.MessageType.CHANGE_EQUALIZER,
    value: equalizer.normalize(value),
    equalizerMixAccess: await equalizerMixAccess(),
    ...(retry ? { retry: true } : {})
  }), () => current === revision)
}
