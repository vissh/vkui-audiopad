import { baseEnums, initialState } from "@vk-audiopad/common";
import { nextTrack } from "../actions/next";
import { playCurrentTrack } from "../actions/repeat";
import { fetchStartPlayback } from "../fetchers/startPlayback";
import { applicationState, playerElement } from "../state";
import { storage } from "../storage";
import { setBadgeText } from "../utils";

let errorCounter = 0;
const errorCountLimit = 10;

export const startListeningPlayerEvents = () => {
    playerElement.addEventListener("playing", onPlaying);
    playerElement.addEventListener("pause", onPause);
    playerElement.addEventListener("ended", onEnded);
    playerElement.addEventListener("error", onError);
    playerElement.addEventListener("timeupdate", createOnTimeUpdateFn());
};

const onPlaying = async () => {
    errorCounter = 0;
    const storageVolume = await storage.volume.get();
    playerElement.volume = storageVolume === undefined ? initialState.Application.volume : storageVolume;

    const [duration, currentTime] = [playerElement.duration || 0, Math.floor(playerElement.currentTime)];
    await storage.set({ played: true, duration: duration, currentTime: currentTime });

    const track = applicationState.activeTrack;
    const deviceId = applicationState.deviceId;
    setTimeout(async () => {
        if (track) {
            await fetchStartPlayback(track, deviceId);
        }
    }, 100);
};

const onEnded = async () => {
    await storage.played.set(false);
    const repeat = await storage.repeat.get();
    if (repeat === baseEnums.ERepeat.REPEAT_ONE) {
        return await playCurrentTrack();
    }
    await nextTrack();
};

const onPause = async () => {
    await storage.played.set(false);
};

const onError = async () => {
    if (errorCounter >= errorCountLimit) {
        return;
    }
    errorCounter += 1;
    await new Promise(r => setTimeout(r, 300));
    await nextTrack();
};

const createOnTimeUpdateFn = () => {
    let previousDuration = 0;
    let previousTime = 0;

    return async () => {
        const duration = playerElement.duration || 0;
        const currentTime = Math.floor(playerElement.currentTime);

        if (previousDuration === duration && previousTime === currentTime) {
            return;
        }

        previousDuration = duration;
        previousTime = currentTime;

        await storage.set({ duration: duration, currentTime: currentTime });

        if (playerElement.paused) {
            return;
        }

        if (window["browser"]) {
            chrome.browserAction.setBadgeText({ text: "►" });
            return;
        }

        if (applicationState) {
            setBadgeText(applicationState.durationMode);
        }
    }
};
