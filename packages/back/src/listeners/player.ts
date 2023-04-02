import { fetchers, initialState, storage, types } from "@vk-audiopad/common";
import { distinctUntilChanged, fromEvent, map } from "rxjs";
import { nextTrack, playCurrentTrack } from "../actions";
import { applicationState, playerElement } from "../state";
import { setBadgeText } from "../utils";

export const startListeningPlayerEvents = () => {
    fromEvent(playerElement, "playing").subscribe(onPlaying);
    fromEvent(playerElement, "pause").subscribe(onPause);
    fromEvent(playerElement, "ended").subscribe(onEnded);
    fromEvent(playerElement, "timeupdate").pipe(currentTime(), timeChanged()).subscribe(onTimeUpdate);
};

const onPlaying = async () => {
    playerElement.volume = await storage.volume.get() || initialState.Application.volume;

    const [duration, currentTime] = [playerElement.duration || 0, Math.floor(playerElement.currentTime)];
    await storage.set({ played: true, duration: duration, currentTime: currentTime });

    const track = applicationState.activeTrack;
    const deviceId = applicationState.deviceId;
    setTimeout(async () => {
        if (track) {
            await fetchers.startPlayback(track, deviceId);
        }
    }, 10);
};

const onEnded = async () => {
    await storage.played.set(false);
    const repeat = await storage.repeat.get();
    if (repeat === types.EnumRepeat.REPEAT_ONE) {
        return await playCurrentTrack();
    }
    await nextTrack();
};

const onPause = async () => {
    await storage.played.set(false);
};

const currentTime = () => {
    return map(() => [playerElement.duration || 0, Math.floor(playerElement.currentTime)]);
};

const timeChanged = () => {
    return distinctUntilChanged((previous: any, current: any) => previous.toString() === current.toString());
};

const onTimeUpdate = async ([duration, currentTime]: [number, number]) => {
    await storage.set({ duration: duration, currentTime: currentTime });

    if (window["browser"]) {
        chrome.browserAction.setBadgeText({ text: "►" });
        return;
    }

    if (applicationState) {
        setBadgeText(applicationState.durationReverse);
    }
}
