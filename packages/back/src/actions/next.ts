import { baseEnums } from "@vk-audiopad/common";
import { applicationState } from "../state";
import { ActionType } from "../types";
import { getNewIndex, sendListenedData } from "../utils";
import { playNewTrack } from "./play-new-track";

export const nextTrack = async () => {
    sendListenedData(baseEnums.EEndOfStreamReason.Next);
    await playNewTrackByIndex("next");
};

export const previousTrack = async () => {
    sendListenedData(baseEnums.EEndOfStreamReason.Prev);
    await playNewTrackByIndex("prev");
};

const playNewTrackByIndex = async (action: ActionType) => {
    if (!applicationState.currentPlaylist) {
        return;
    }

    let newIndex = 0;

    if (applicationState.currentPlaylist.isRadio) {
        const tracks = applicationState.currentPlaylist.tracks;
        newIndex = getNewIndex(action, applicationState.activeTrackIndex, tracks.length);
    } else {
        newIndex = getNewIndex(action, applicationState.activeTrackIndex, applicationState.audiosIds.length);
    }

    await playNewTrack(newIndex, applicationState.currentPlaylist);
};
