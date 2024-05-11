import { commonUtils } from '@vk-audiopad/common'

export const startListeningOnInstalled = (): void => {
  // Действия при установке/обновлении расширения.
  chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
      commonUtils.clearStorage()
    }
  })
}
