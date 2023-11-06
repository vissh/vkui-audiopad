import { baseTypes } from "@vk-audiopad/common";

const deletedTracks: Record<string, baseTypes.TTrackItem> = {};

export const addDeletedTrack = (track: baseTypes.TTrackItem) => {
    deletedTracks[track.id] = track;
}

export const removeDeletedTrack = (track: baseTypes.TTrackItem) => {
    delete deletedTracks[track.id];
}

export const deleteTracksPendingDeletion = () => {
    Object.values(deletedTracks).forEach((track) => {
        chrome.runtime.sendMessage({ type: "removeTrack", data: { track: track } });
    });
    for (var member in deletedTracks) delete deletedTracks[member];
}
