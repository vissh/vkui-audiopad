import { equalizer } from '@vk-audiopad/common'
import { migrateStoredState } from '../storage-migrations'

export const startListeningOnInstalled = (): void => {
  chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
      void update(details.previousVersion).catch(() => { console.warn('Update cleanup failed') })
    }
  })
}

const update = async (previousVersion: string | undefined): Promise<void> => {
  await migrateStoredState()
  if (equalizer.shouldAnnounceUpgrade(previousVersion, chrome.runtime.getManifest().version)) {
    await chrome.storage.local.set({ equalizerAnnouncementPending: true })
  }
}
