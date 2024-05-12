import { commonUtils } from '@vk-audiopad/common'
import { startListeningCommandEvents } from './listeners/command'
import { startListeningOnInstalled } from './listeners/install'
import { startListeningMessages } from './listeners/messages'
import { startListeningStorageEvents } from './listeners/storage'
import { startListeningOnUninstalled } from './listeners/uninstall'
import { loadState } from './state'

const runScript = async (): Promise<void> => {
  let serviceWorkerMode = false
  try {
    console.log(document.head)
  } catch (err) {
    // Для скрипта, подключенного как service_worker, DOM будет недоступен,
    // поэтому таким образом можем явно проверить как запускается скрипт.
    serviceWorkerMode = true
  }

  if (serviceWorkerMode) {
    startListeners()
    return
  }

  // Так как скрипт service-worker.js подключается и в документе offscreen.html,
  // нужно избежать двойного запуска и выполняться только при отсутствии поддержки offscreen документов.
  if (await commonUtils.offscreenDocumentSupport()) {
    return
  }

  startListeners()
}

const startListeners = (): void => {
  void loadState()
  startListeningCommandEvents()
  startListeningOnInstalled()
  void startListeningMessages()
  startListeningStorageEvents()
  startListeningOnUninstalled()
}

void runScript()
