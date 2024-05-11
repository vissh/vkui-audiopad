import { startListeningCommandEvents } from './listeners/command'
import { startListeningOnInstalled } from './listeners/install'
import { startListeningMessages } from './listeners/messages'
import { startListeningStorageEvents } from './listeners/storage'
import { startListeningOnUninstalled } from './listeners/uninstall'

startListeningCommandEvents()
startListeningOnInstalled()
startListeningMessages()
startListeningStorageEvents()
startListeningOnUninstalled()
