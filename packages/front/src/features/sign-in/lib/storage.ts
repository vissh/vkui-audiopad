import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { v4 as uuid4 } from 'uuid'

export const updateWebToken = (webToken: commonTypes.WebToken) => {
  if (webToken.error?.type === 'unauthorized') {
    logout(); return
  }

  chrome.storage.local.get(['userId', 'deviceId'], (items) => {
    if (webToken.error != null) {
      logout(); return
    }

    void login(items.userId, items.deviceId, webToken)
  })
}

const logout = () => {
  commonUtils.clearStorage()
}

const login = async (
  userId: string | undefined,
  deviceId: string | undefined,
  webToken: commonTypes.WebToken
) => {
  const items = {
    userId: webToken.userId,
    webToken,
    deviceId: (deviceId != null) || uuid4()
  }

  if (userId === webToken.userId) {
    await chrome.storage.local.set(items); return
  }

  items.deviceId = uuid4()
  chrome.storage.local.set(items, () => {
    const saveCustomKeys = Object.keys(items)
    commonUtils.clearStorage(saveCustomKeys)
  })
}
