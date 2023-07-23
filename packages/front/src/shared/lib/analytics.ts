import { baseEnums } from "@vk-audiopad/common";

export const sendEventOpenTab = (tab: baseEnums.EContentTab) => {
    sendTopEvent("tab", tab, getVersion());
};

export const sendEventControlButton = (label: string) => {
    sendTopEvent("controls", "click", `${label}:${getVersion()}`);
};

export const sendEventControlSlider = (label: string) => {
    sendTopEvent("controls", "slide", `${label}:${getVersion()}`);
};

export const sendEventControlSearchArtist = () => {
    sendTopEvent("controls", "search", `artist:${getVersion()}`);
};

export const sendEventPlayTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "play", `${tab}:${getVersion()}`);
};

export const sendEventPauseTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "pause", `${tab}:${getVersion()}`);
};

export const sendEventResumeTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "resume", `${tab}:${getVersion()}`);
};

export const sendEventSearchArtist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "searchArtist", `${tab}:${getVersion()}`);
};

export const sendEventClickArtist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "clickArtist", `${tab}:${getVersion()}`);
};

export const sendEventAddTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "added", `${tab}:${getVersion()}`);
};

export const sendEventRemoveTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "remove", `${tab}:${getVersion()}`);
};

export const sendEventRemoveCancelTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "removeCancel", `${tab}:${getVersion()}`);
};

export const sendEventAddToQueue = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "addToQueue", `${tab}:${getVersion()}`);
};

export const sendEventSearchTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "searchTrack", `${tab}:${getVersion()}`);
};

export const sendEventShowAllTracks = (tab: baseEnums.EContentTab) => {
    sendTopEvent("playlistTracks", "showAll", `${tab}:${getVersion()}`);
};

export const sendEventShowAllPlaylists = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylists", "showAll", `${tab}:${getVersion()}`);
};

export const sendEventOpenCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "open", `${tab}:${getVersion()}`);
};

export const sendEventPlayCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "play", `${tab}:${getVersion()}`);
};

export const sendEventPauseCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "pause", `${tab}:${getVersion()}`);
};

export const sendEventResumeCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "resume", `${tab}:${getVersion()}`);
};

export const sendEventFollowCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "follow", `${tab}:${getVersion()}`);
};

export const sendEventUnfollowCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "unfollow", `${tab}:${getVersion()}`);
};

let _version = "";

const getVersion = () => {
    if (!_version) {
        _version = chrome.runtime.getManifest().version;
    }
    return _version;
};

const sendTopEvent = (category: string, action: string, label: string) => {
    var _tmr = window._tmr || (window._tmr = []);
    _tmr.push({ id: "3298105", type: "sendEvent", category: category, action: action, label: label });
};
