import { TypeTitlePlaylist, TypeTrackItem } from "./types";

export const activeTrack = (track: TypeTrackItem, playlist: TypeTitlePlaylist) => {
    chrome.runtime.sendMessage({ type: "activeTrack", data: { track: track, playlist: playlist } });
};

export const nextTrack = () => {
    chrome.runtime.sendMessage({ type: "nextTrack" });
};

export const prevTrack = () => {
    chrome.runtime.sendMessage({ type: "previousTrack" });
};

export const currentTime = async (value: number) => {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: "currentTime", data: { value: value } }, () => resolve(null));
    });
};
