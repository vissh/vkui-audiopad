import { initialState, storage, types } from "@vk-audiopad/common";
import { fromEvent } from "rxjs";

declare global {
    interface Window { applicationState: types.TypeApplicationState; }
}

export const playerElement = document.getElementById("audio-player") as HTMLVideoElement;
export const applicationState: types.TypeApplicationState = Object.assign({}, initialState.Application);
window.applicationState = applicationState;

fromEvent(document, "DOMContentLoaded")
    .subscribe(async () => {
        const partialAppState = await storage.load();
        Object.assign(applicationState, partialAppState);

        if (applicationState.played && playerElement.paused) {
            await storage.played.set(false);
        }

        storage.listen((changes) => {
            Object.assign(applicationState, changes);
        });

        chrome.browserAction.setBadgeBackgroundColor({ color: "#0077FF" });
    });
