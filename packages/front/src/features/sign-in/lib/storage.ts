import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { v4 as uuid4 } from 'uuid'

let writing = Promise.resolve()

export const updateWebToken = (webToken: commonTypes.WebToken, signal?: AbortSignal): Promise<void> => {
  const update = writing.then(async () => {
    signal?.throwIfAborted()
    if (webToken.error?.type === 'exception') return
    if (webToken.error?.type === 'unauthorized') {
      await commonUtils.clearStorage()
      return
    }
    const stored = await chrome.storage.local.get(['userId', 'deviceId'])
    signal?.throwIfAborted()
    const sameUser = stored.userId === webToken.userId
    const items = {
      userId: webToken.userId,
      webToken,
      deviceId: sameUser && typeof stored.deviceId === 'string' ? stored.deviceId : uuid4()
    }
    if (!sameUser) {
      // Clear old account data before publishing the new account identity.
      await commonUtils.clearStorage(Object.keys(items))
      signal?.throwIfAborted()
    }
    await chrome.storage.local.set(items)
  })
  writing = update.then(() => {}, () => {})
  return update
}
