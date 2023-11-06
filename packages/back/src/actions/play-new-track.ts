import { baseEnums, baseTypes, stateTypes } from "@vk-audiopad/common";
import { fetchAudiosIdsBySource } from "../fetchers/audio-ids-by-source";
import { fetchTrackInfo } from "../fetchers/track-info";
import { destroyPlayer, playTrack } from "../player";
import { applicationState } from "../state";
import { createAudiosIds, getNewIndex, sendListenedData, shuffle } from "../utils";

export const playNewTrack = async (trackIndex: number, playlist: baseTypes.TTitlePlaylist, fromOriginalSort?: boolean) => {
    destroyPlayer();
    sendListenedData(baseEnums.EEndOfStreamReason.New);

    const currentPlaylist = applicationState.currentPlaylist;

    const isNewPlaylist: boolean = !currentPlaylist || differentPlaylists(playlist, currentPlaylist);

    let audiosIds = applicationState.audiosIds;
    const originalAudiosIds = applicationState.originalAudiosIds;

    if (isNewPlaylist) {
        audiosIds = createAudiosIds(playlist.tracks);
    }

    let trackId: string;
    let accessKey: string;
    let track: baseTypes.TTrackItem;

    if (!isNewPlaylist && fromOriginalSort && applicationState.shuffle) {
        [trackId, accessKey] = originalAudiosIds[trackIndex] || originalAudiosIds[0];
        trackIndex = audiosIds.findIndex(([elementTrackId]) => elementTrackId === trackId);
    } else {
        [trackId, accessKey] = audiosIds[trackIndex] || audiosIds[0];
    }

    if (playlist.isRadio) {
        const tracks = playlist ? playlist.tracks : (applicationState.currentPlaylist?.tracks || []);
        track = tracks[trackIndex];
    } else {
        const possibleTrack = await fetchTrackInfo(applicationState.userId, trackId, accessKey);
        if (!possibleTrack) {
            const newIndex = getNewIndex("next", applicationState.activeTrackIndex, applicationState.audiosIds.length);
            await playNewTrack(newIndex, playlist, fromOriginalSort);
            return;
        }
        track = possibleTrack;
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
            const newActiveTrackIndex = shuffledAudiosIds.findIndex(([trackId]) => trackId === track.id);

            chrome.storage.local.set({
                ...changes,
                activeTrackIndex: newActiveTrackIndex,
                audiosIds: shuffledAudiosIds,
                originalAudiosIds: audiosIds,
            });
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
