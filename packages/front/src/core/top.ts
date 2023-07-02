import { baseEnums } from "@vk-audiopad/common";

let version = "";

export const sendEventOpenTab = (tab: baseEnums.EContentTab) => {
    if (!version) {
        version = chrome.runtime.getManifest().version;
    }
    sendTopEvent("tab", tab, version);
};

export const sendEventControlButton = (label: string) => {
    sendTopEvent("controls", "click", label);
};

export const sendEventControlSlider = (label: string) => {
    sendTopEvent("controls", "slide", label);
};

export const sendEventControlSearchArtist = () => {
    sendTopEvent("controls", "search", "artist");
};

export const sendEventPlayTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "play", tab);
};

export const sendEventPauseTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "pause", tab);
};

export const sendEventResumeTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "resume", tab);
};

export const sendEventSearchArtist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "searchArtist", tab);
};

export const sendEventAddTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "added", tab);
};

export const sendEventRemoveTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "remove", tab);
};

export const sendEventRemoveCancelTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "removeCancel", tab);
};

export const sendEventAddToQueue = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "addToQueue", tab);
};

export const sendEventSearchTrack = (tab: baseEnums.EContentTab) => {
    sendTopEvent("track", "searchTrack", tab);
};

export const sendEventShowAllTracks = (tab: baseEnums.EContentTab) => {
    sendTopEvent("playlistTracks", "showAll", tab);
};

export const sendEventShowAllPlaylists = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylists", "showAll", tab);
};

export const sendEventOpenCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "open", tab);
};

export const sendEventPlayCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "play", tab);
};

export const sendEventPauseCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "pause", tab);
};

export const sendEventResumeCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "resume", tab);
};

export const sendEventFollowCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "follow", tab);
};

export const sendEventUnfollowCoverPlaylist = (tab: baseEnums.EContentTab) => {
    sendTopEvent("coverPlaylist", "unfollow", tab);
};

const sendTopEvent = (category: string, action: string, label: string) => {
    var _tmr = window._tmr || (window._tmr = []);
    _tmr.push({ id: "3298105", type: "sendEvent", category: category, action: action, label: label });
};
