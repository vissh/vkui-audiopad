import { baseTypes, stateTypes } from "@vk-audiopad/common";
import { applicationState } from "../state";

export const removeTrack = (track: baseTypes.TTrackItem) => {
    if (!applicationState.currentPlaylist || !applicationState.activeTrack) {
        return;
    }

    const changes: Partial<stateTypes.TApplicationState> = {};

    const newTracks = applicationState.currentPlaylist.tracks.filter(x => x.id !== track.id);
    const newAudiosIds = applicationState.audiosIds.filter(([trackId]) => trackId !== track.id);
    const originalAudiosIds = applicationState.originalAudiosIds.filter(([trackId]) => trackId !== track.id);

    if (newTracks.length !== applicationState.currentPlaylist.tracks.length) {
        changes.currentPlaylist = { ...applicationState.currentPlaylist, tracks: newTracks };
    }

    if (newAudiosIds.length !== applicationState.audiosIds.length) {
        changes.audiosIds = newAudiosIds;
        changes.activeTrackIndex = Math.max(0, newAudiosIds.findIndex(([trackId]) => trackId === applicationState.activeTrack?.id));
    }

    if (originalAudiosIds.length !== applicationState.originalAudiosIds.length) {
        changes.originalAudiosIds = originalAudiosIds;
    }

    if (Object.keys(changes).length) {
        chrome.storage.local.set(changes);
    }
};
