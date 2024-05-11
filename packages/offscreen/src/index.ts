import { startActivityChecker } from './activity-checker'
import { startListeningMessages } from './listeners/messages'
import { startListeningPlayerEvents } from './listeners/player-events'

startActivityChecker()
startListeningPlayerEvents()
startListeningMessages()
