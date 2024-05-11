import { startListeningCommandEvents } from './listeners/command'
import { startListeningOnInstalled } from './listeners/install'
import { startListeningMessages } from './listeners/messages'
import { startListeningStorageEvents } from './listeners/storage'
import { startListeningOnUninstalled } from './listeners/uninstall'
import { loadState } from './state'

void loadState()

startListeningCommandEvents()
startListeningOnInstalled()
startListeningMessages()
startListeningStorageEvents()
startListeningOnUninstalled()
