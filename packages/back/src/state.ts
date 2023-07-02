import { initialState, stateTypes } from "@vk-audiopad/common";
import { storage } from "./storage";

declare global {
    interface Window { applicationState: stateTypes.TApplicationState; }
}

export const applicationState: stateTypes.TApplicationState = Object.assign({}, initialState.Application);

window.applicationState = applicationState;

document.addEventListener("DOMContentLoaded", async () => {
    const partialAppState = await storage.load();
    Object.assign(applicationState, partialAppState);

    if (applicationState.played) {
        await storage.played.set(false);
    }

    storage.listen((changes) => {
        Object.assign(applicationState, changes);
    });

    chrome.browserAction.setBadgeBackgroundColor({ color: "#0077FF" });
});
