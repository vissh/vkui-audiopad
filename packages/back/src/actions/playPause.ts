import { destroyPlayer } from "../player";
import { applicationState, playerElement } from "../state";
import { playNewTrack } from "./playNewTrack";

export const onPlayed = async (played: boolean | undefined) => {
    if (played === undefined) {
        destroyPlayer();
        chrome.browserAction.setBadgeText({ text: "" });
        return;
    }

    if (!played) {
        playerElement.src && playerElement.pause();
        chrome.browserAction.setBadgeText({ text: "" });
        return;
    }

    if (playerElement.src) {
        playerElement.play();
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
