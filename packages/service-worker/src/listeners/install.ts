import { commonUtils, equalizer } from '@vk-audiopad/common'

export const startListeningOnInstalled = (): void => {
  chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
      void update(details.previousVersion).catch(() => { console.warn('Update cleanup failed') })
    }
  })
}

const update = async (previousVersion: string | undefined): Promise<void> => {
  await commonUtils.clearStorage()
  if (equalizer.shouldAnnounceUpgrade(previousVersion, chrome.runtime.getManifest().version)) {
    await chrome.storage.local.set({ equalizerAnnouncementPending: true })
  }
}
