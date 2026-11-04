import { commonUtils } from '@vk-audiopad/common'
import { startListeningCommandEvents } from './listeners/command'
import { startListeningOnInstalled } from './listeners/install'
import { startListeningMessages } from './listeners/messages'
import { startListeningStorageEvents } from './listeners/storage'
import { startListeningOnUninstalled } from './listeners/uninstall'
import { initializePlayback } from './initialize'
import { createReadiness } from './readiness'

const startListeners = (offscreen: boolean): void => {
  const readiness = createReadiness(async acceptMedia => { await initializePlayback(offscreen, acceptMedia) })
  startListeningCommandEvents(readiness)
  startListeningOnInstalled()
  void startListeningMessages(readiness, offscreen).catch(() => { console.warn('Background message registration failed') })
  startListeningStorageEvents(readiness)
  startListeningOnUninstalled()
  void readiness.start()
}

if (typeof document === 'undefined') {
  // Chrome requires event registration during the initial synchronous evaluation.
  startListeners(true)
} else {
  // The Chrome offscreen page also includes this bundle; Firefox owns both runtimes.
  void commonUtils.offscreenDocumentSupport().then(offscreen => {
    if (!offscreen) startListeners(false)
  }).catch(() => { console.warn('Background environment could not be initialized') })
}
