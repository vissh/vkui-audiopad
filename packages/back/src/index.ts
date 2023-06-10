import { startListeningCommandEvents } from "./listeners/command";
import { startListiningOnInstalled } from "./listeners/install";
import { startListiningPopupMessages } from "./listeners/messages";
import { startListeningPlayerEvents } from "./listeners/player";
import { startListiningStorageEvents } from "./listeners/storage";
import { startListiningWebRequests } from "./listeners/webRequest";

startListeningCommandEvents();
startListiningPopupMessages();
startListiningOnInstalled();
startListeningPlayerEvents();
startListiningStorageEvents();
startListiningWebRequests();
