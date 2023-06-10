import { baseEnums, baseTypes, stateTypes } from "@vk-audiopad/common";
import { fetchAudiosIdsBySource } from "../fetchers/audioIdsBySource";
import { fetchTrackInfo } from "../fetchers/trackInfo";
import { destroyPlayer, playTrack } from "../player";
import { applicationState } from "../state";
import { createAudiosIds, sendListenedData, shuffle } from "../utils";

export const playNewTrack = async (trackIndex: number, playlist: baseTypes.TTitlePlaylist) => {
    destroyPlayer();
    sendListenedData(baseEnums.EEndOfStreamReason.New);

    const currentPlaylist = applicationState.currentPlaylist;

    const isNewPlaylist = !currentPlaylist || differentPlaylists(playlist, currentPlaylist);

    let audiosIds = applicationState.audiosIds;
    const originalAudiosIds = applicationState.originalAudiosIds;

    if (isNewPlaylist) {
        audiosIds = createAudiosIds(playlist.tracks);
    }

    let trackId: string;
    let accessKey: string;
    let track: baseTypes.TTrackItem;

    if (!isNewPlaylist && applicationState.shuffle) {
        [trackId, accessKey] = originalAudiosIds[trackIndex] || originalAudiosIds[0];
        trackIndex = audiosIds.findIndex(([elementTrackId]) => elementTrackId === trackId);
    } else {
        [trackId, accessKey] = audiosIds[trackIndex] || audiosIds[0];
    }

    if (playlist.isRadio) {
        const tracks = playlist ? playlist.tracks : (applicationState.currentPlaylist?.tracks || []);
        track = tracks[trackIndex];
    } else {
        track = await fetchTrackInfo(applicationState.userId, trackId, accessKey);
    }

    const changes: Partial<stateTypes.TApplicationState> = {
        activeTrack: track,
        activeTrackIndex: trackIndex,
    };

    if (isNewPlaylist) {
        changes.currentPlaylist = playlist;
        changes.audiosIds = audiosIds;
    }

    chrome.storage.local.set(changes);

    playTrack(track);

    if (isNewPlaylist && !playlist.isRadio) {
        const audiosIds = await fetchAudiosIdsBySource(playlist);

        if (applicationState.shuffle) {
            const shuffledAudiosIds = shuffle(audiosIds);
            chrome.storage.local.set({ audiosIds: shuffledAudiosIds, originalAudiosIds: audiosIds });
        } else {
            chrome.storage.local.set({ audiosIds: audiosIds, originalAudiosIds: [] });
        }
    }
};


const differentPlaylists = (newPlaylist: baseTypes.TTitlePlaylist, oldPlaylist: baseTypes.TTitlePlaylist): boolean => {
    if (newPlaylist.id !== oldPlaylist.id
        || newPlaylist.ownerId !== oldPlaylist.ownerId
        || newPlaylist.blockId !== oldPlaylist.blockId
        || newPlaylist.tracks.length !== oldPlaylist.tracks.length) {
        return true;
    }

    const newAudioIds = createAudiosIds(newPlaylist.tracks);
    const oldAudioIds = createAudiosIds(oldPlaylist.tracks);

    return !newAudioIds.every(([trackId], index) => trackId === oldAudioIds[index][0]);
};
