import { audioElement, destroyPlayer } from "../player";
import { applicationState } from "../state";
import { playNewTrack } from "./playNewTrack";

export const onPlayed = async (played: boolean | undefined) => {
    if (played === undefined) {
        destroyPlayer();
        chrome.browserAction.setBadgeText({ text: "" });
        return;
    }

    if (!played) {
        audioElement.src && audioElement.pause();
        chrome.browserAction.setBadgeText({ text: "" });
        return;
    }

    if (audioElement.src) {
        audioElement.play();
        return;
    }

    await reloadTrack();
};

const reloadTrack = async () => {
    if (!applicationState.currentPlaylist || !applicationState.activeTrack) {
        return;
    }

    await playNewTrack(applicationState.activeTrackIndex, applicationState.currentPlaylist);
};
