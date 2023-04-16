import { TypeTitlePlaylist } from "./types";

export const activeTrack = (trackIndex: number, playlist: TypeTitlePlaylist) => {
    chrome.runtime.sendMessage({ type: "activeTrack", data: { trackIndex: trackIndex, playlist: playlist } });
};

export const nextTrack = () => {
    chrome.runtime.sendMessage({ type: "nextTrack" });
};

export const prevTrack = () => {
    chrome.runtime.sendMessage({ type: "previousTrack" });
};

export const currentTime = async (value: number) => {
    return new Promise(resolve => {
        const message = { type: "currentTime", data: { value: value } };
        const callback = () => resolve(null);
        chrome.runtime.sendMessage(message, callback);
    });
};

export const repeat = () => {
    chrome.runtime.sendMessage({ type: "repeat" });
};
