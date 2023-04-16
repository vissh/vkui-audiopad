import { fetchers, storage, types } from "@vk-audiopad/common";
import Hls from "hls.js";
import { applicationState, playerElement } from "./state";
import { createAudiosIds, getNewIndex, sendListenedData, shuffle } from "./utils";

const hlsWorkers: Array<Hls> = [];

export const nextTrack = async () => {
    sendListenedData(types.EndOfStreamReason.Next);
    await playNewTrackByIndex("next");
};

export const previousTrack = async () => {
    sendListenedData(types.EndOfStreamReason.Prev);
    await playNewTrackByIndex("prev");
};

export const playCurrentTrack = async () => {
    sendListenedData(types.EndOfStreamReason.New);
    if (applicationState.activeTrack && applicationState.currentPlaylist) {
        return await playNewTrack(applicationState.activeTrackIndex);
    }
};

export const reloadTrack = async () => {
    if (!applicationState.currentPlaylist || !applicationState.activeTrack) {
        return;
    }

    if (applicationState.currentPlaylist.isRadio) {
        return await playNewRadio(applicationState.activeTrackIndex);
    }

    await playNewTrack(applicationState.activeTrackIndex);
};

export const playTrackFromNewPlaylist = async (trackIndex: number, playlist: types.TypeTitlePlaylist) => {
    sendListenedData(types.EndOfStreamReason.New);
    return await playNewTrack(trackIndex, playlist);
};

export const playNewRadio = async (trackIndex: number, playlist?: types.TypeTitlePlaylist) => {
    const fetchTrack = async () => {
        const tracks = playlist ? playlist.tracks : applicationState.currentPlaylist?.tracks || [];
        return [tracks[trackIndex], trackIndex]
    };

    return await playNewSource(fetchTrack, playlist);
};

export const repeat = async () => {
    const nextMode = {
        [types.EnumRepeat.NONE]: types.EnumRepeat.REPEAT,
        [types.EnumRepeat.REPEAT]: types.EnumRepeat.REPEAT_ONE,
        [types.EnumRepeat.REPEAT_ONE]: types.EnumRepeat.NONE,
    };
    const value = applicationState.repeat || types.EnumRepeat.NONE;
    await storage.repeat.set(nextMode[value]);
};

export const destroyPlayer = () => {
    while (hlsWorkers.length > 0) {
        const oldHlsWorker = hlsWorkers.pop();
        if (!oldHlsWorker) {
            break;
        }
        oldHlsWorker.stopLoad();
        oldHlsWorker.detachMedia();
        oldHlsWorker.destroy();
    }

    playerElement.removeAttribute("src");
};

const playNewTrack = async (trackIndex: number, playlist?: types.TypeTitlePlaylist) => {
    const audiosIds = playlist ? createAudiosIds(playlist.tracks) : applicationState.audiosIds;

    const trackFetcher = async () => {
        const [trackId, accessKey] = audiosIds[trackIndex] || audiosIds[0];
        const track = await fetchers.trackInfo(applicationState.userId, trackId, accessKey);
        return [track, trackIndex];
    };

    await playNewSource(trackFetcher, playlist, audiosIds);

    if (playlist) {
        const audiosIds = await fetchers.audiosIdsBySource(playlist);
        if (playlist.id === applicationState.currentPlaylist?.id
            && playlist.ownerId === applicationState.currentPlaylist?.ownerId
            && playlist.blockId === applicationState.currentPlaylist?.blockId) {

            if (applicationState.shuffle) {
                const shuffledAudiosIds = shuffle(audiosIds);
                await storage.set({ audiosIds: shuffledAudiosIds, originalAudiosIds: audiosIds });
            } else {
                await storage.set({ audiosIds: audiosIds, originalAudiosIds: [] });
            }
        }
    }
};

const playNewSource = async (callback: Function, playlist?: types.TypeTitlePlaylist, audiosIds?: Array<types.TypeAudioTuple>) => {
    destroyPlayer();

    const [track, trackIndex] = await callback();

    if (playlist !== undefined) {
        const newAudiosIds = audiosIds || createAudiosIds(playlist.tracks);
        await storage.set({ activeTrack: track, activeTrackIndex: trackIndex, currentPlaylist: playlist, audiosIds: newAudiosIds });
    } else {
        await storage.set({ activeTrack: track, activeTrackIndex: trackIndex });
    }

    if (!track.url.includes("index.m3u8")) {
        playerElement.src = track.url;
        playerElement.play();
        return;
    }

    const hls = new Hls();
    hlsWorkers.push(hls);
    hls.loadSource(track.url);
    hls.attachMedia(playerElement);
    hls.on(Hls.Events.MEDIA_ATTACHED, async () => { playerElement.play() });
};

const playNewTrackByIndex = async (action: "next" | "prev") => {
    if (!applicationState.currentPlaylist) {
        return;
    }

    if (applicationState.currentPlaylist.isRadio) {
        const tracks = applicationState.currentPlaylist.tracks;
        const newIndex = getNewIndex(action, applicationState.activeTrackIndex, tracks.length);
        await playNewRadio(newIndex);
    } else {
        const newIndex = getNewIndex(action, applicationState.activeTrackIndex, applicationState.audiosIds.length);
        await playNewTrack(newIndex);
    }
};
