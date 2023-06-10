import { baseTypes } from "@vk-audiopad/common";

const sendActiveTrack = (trackIndex: number, playlist: baseTypes.TTitlePlaylist) => {
    chrome.runtime.sendMessage({ type: "activeTrack", data: { trackIndex: trackIndex, playlist: playlist } });
};

const sendNextTrack = () => {
    chrome.runtime.sendMessage({ type: "nextTrack" });
};

const sendPreviousTrack = () => {
    chrome.runtime.sendMessage({ type: "previousTrack" });
};

const sendCurrentTime = async (value: number) => {
    return new Promise(resolve => {
        const message = { type: "currentTime", data: { value: value } };
        const callback = () => resolve(null);
        chrome.runtime.sendMessage(message, callback);
    });
};

const sendRepeat = () => {
    chrome.runtime.sendMessage({ type: "repeat" });
};

const sendEditedCurrentPlaylist = (playlist: baseTypes.TTitlePlaylist, oldPlaylist: baseTypes.TTitlePlaylist, actions: Array<Array<any>>) => {
    const data = {
        playlist: playlist,
        oldPlaylist: oldPlaylist,
        actions: actions,
    };
    chrome.runtime.sendMessage({ type: "editCurrentPlaylist", data: data });
};

const sendRemoveTrack = (track: baseTypes.TTrackItem) => {
    chrome.runtime.sendMessage({ type: "removeTrack", data: { track: track } });
};

const sendAddTrack = (track: baseTypes.TTrackItem) => {
    chrome.runtime.sendMessage({ type: "addTrack", data: { track: track } });
}

export const actions = {
    activeTrack: sendActiveTrack,
    nextTrack: sendNextTrack,
    previousTrack: sendPreviousTrack,
    changeCurrentTime: sendCurrentTime,
    repeat: sendRepeat,
    editCurrentPlaylist: sendEditedCurrentPlaylist,
    removeTrack: sendRemoveTrack,
    addTrack: sendAddTrack,
};
