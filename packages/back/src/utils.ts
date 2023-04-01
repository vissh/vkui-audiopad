import { fetchers, types, utils } from "@vk-audiopad/common";
import { applicationState, playerElement } from "./state";

export const shuffle = (array: Array<types.TypeAudioTuple>): Array<types.TypeAudioTuple> => {
    const result = [...array];
    for (var i = result.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }
    return result;
};

export const getNewIndex = (action: "next" | "prev", index: number, length: number): number => {
    const value = action === "next" ? (index + 1) % length : (index || length) - 1;
    return value < 0 ? 0 : value;
};

export const createAudiosIds = (tracks: types.TypeTrackItem[]): Array<types.TypeAudioTuple> => {
    return tracks.map(track => [track.id, track.accessKey]);
};

export const sendListenedData = (endStreamReason: types.EndOfStreamReason) => {
    if (applicationState.activeTrack && !applicationState.currentPlaylist?.isRadio) {
        const listenedData: types.TypeListenedDataFetchArgs = {
            userId: applicationState.userId,
            track: applicationState.activeTrack,
            listened: Math.floor(playerElement.currentTime),
            endStreamReason: endStreamReason,
        };
        setTimeout(async () => await fetchers.listenedData(listenedData), 10);
    }
};

export const setBadgeText = (durationReverse: boolean) => {
    const [duration, currentTime] = [playerElement.duration || 0, Math.floor(playerElement.currentTime)];

    if (duration && duration !== Infinity) {
        const time = durationReverse ? duration - currentTime : currentTime;
        const value = utils.toHHMMSS(time);
        chrome.browserAction.setBadgeText({ text: durationReverse ? "-" + value : value });
    } else if (duration === Infinity) {
        // radio
        if (applicationState) {
            chrome.browserAction.setBadgeText({ text: utils.toHHMMSS(currentTime) });
        }
    }
};
