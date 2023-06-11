import { baseEnums, baseTypes, utils } from "@vk-audiopad/common";
import { fetchListenedData } from "./fetchers/listenedData";
import { applicationState, playerElement } from "./state";
import { ActionType, TListenedData } from "./types";

export const shuffle = (array: Array<baseTypes.TAudioTuple>): Array<baseTypes.TAudioTuple> => {
    const result = [...array];
    for (var i = result.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }
    return result;
};

export const sendListenedData = (endStreamReason: baseEnums.EEndOfStreamReason) => {
    if (applicationState.activeTrack && !applicationState.currentPlaylist?.isRadio) {
        const listenedData: TListenedData = {
            userId: applicationState.userId,
            track: applicationState.activeTrack,
            listened: Math.floor(playerElement.currentTime),
            endStreamReason: endStreamReason,
        };
        setTimeout(async () => await fetchListenedData(listenedData), 10);
    }
};

export const setBadgeText = (durationMode: baseEnums.EDurationMode) => {
    const timeLeft = durationMode === baseEnums.EDurationMode.TIME_LEFT;
    const [duration, currentTime] = [playerElement.duration || 0, Math.floor(playerElement.currentTime)];

    if (duration && duration !== Infinity) {
        const time = timeLeft ? duration - currentTime : currentTime;
        const value = utils.toHHMMSS(time);
        chrome.browserAction.setBadgeText({ text: timeLeft ? "-" + value : value });
    } else if (duration === Infinity) {
        // radio
        if (applicationState) {
            chrome.browserAction.setBadgeText({ text: utils.toHHMMSS(currentTime) });
        }
    }
};

export const createAudiosIds = (tracks: baseTypes.TTrackItem[]): Array<baseTypes.TAudioTuple> => {
    return tracks.map(track => [track.id, track.accessKey]);
};

export const getNewIndex = (action: ActionType, index: number, length: number): number => {
    const value = action === "next" ? (index + 1) % length : (index || length) - 1;
    return value < 0 ? 0 : value;
};
