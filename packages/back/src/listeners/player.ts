import { baseEnums, initialState } from "@vk-audiopad/common";
import { nextTrack } from "../actions/next";
import { playCurrentTrack } from "../actions/repeat";
import { fetchStartPlayback } from "../fetchers/start-playback";
import { audioElement } from "../player";
import { applicationState } from "../state";
import { storage } from "../storage";
import { setBadgeText } from "../utils";

let errorCounter = 0;
const errorCountLimit = 10;

export const startListeningPlayerEvents = () => {
    audioElement.addEventListener("playing", onPlaying);
    audioElement.addEventListener("pause", onPause);
    audioElement.addEventListener("ended", onEnded);
    audioElement.addEventListener("error", onError);
    audioElement.addEventListener("timeupdate", createOnTimeUpdateFn());
};

const onPlaying = async () => {
    errorCounter = 0;
    const storageVolume = await storage.volume.get();
    audioElement.volume = storageVolume === undefined ? initialState.Application.volume : storageVolume;

    const [duration, currentTime] = [audioElement.duration || 0, Math.floor(audioElement.currentTime)];
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
        const duration = audioElement.duration || 0;
        const currentTime = Math.floor(audioElement.currentTime);

        if (previousDuration === duration && previousTime === currentTime) {
            return;
        }

        previousDuration = duration;
        previousTime = currentTime;

        await storage.set({ duration: duration, currentTime: currentTime });

        if (audioElement.paused) {
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
