import { startListeningCommandEvents } from "./listeners/command";
import { startListeningOnInstalled } from "./listeners/install";
import { startListeningPopupMessages } from "./listeners/messages";
import { startListeningPlayerEvents } from "./listeners/player";
import { startListeningStorageEvents } from "./listeners/storage";
import { startListeningWebRequests } from "./listeners/web-request";

startListeningCommandEvents();
startListeningPopupMessages();
startListeningOnInstalled();
startListeningPlayerEvents();
startListeningStorageEvents();
startListeningWebRequests();
