import { startListeningPlayerEvents } from "./listeners/player";
import { startListiningChromeEvents } from "./listeners/runtime";
import { startListiningStorageEvents } from "./listeners/storage";

startListeningPlayerEvents();
startListiningChromeEvents();
startListiningStorageEvents();
