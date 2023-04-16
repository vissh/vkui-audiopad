import { startListeningCommandEvents } from "./listeners/command";
import { startListeningPlayerEvents } from "./listeners/player";
import { startListiningChromeEvents } from "./listeners/runtime";
import { startListiningStorageEvents } from "./listeners/storage";

startListeningCommandEvents();
startListeningPlayerEvents();
startListiningChromeEvents();
startListiningStorageEvents();
