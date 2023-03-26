import { fetchers, initialState, storage, types, utils } from "@vk-audiopad/common";
import Hls from "hls.js";
import { distinctUntilChanged, fromEvent, map } from "rxjs";

declare global {
    interface Window { applicationState: any; }
}

type TypeMemoryStorage = {
    trackIndex: Record<string, number>;
};

const playerElement = document.getElementById("audio-player") as HTMLVideoElement;
const applicationState: types.TypeApplicationState = Object.assign({}, initialState.Application);
window.applicationState = applicationState;

const memoryStorage: TypeMemoryStorage = {
    trackIndex: {},
};

fromEvent(document, "DOMContentLoaded")
    .subscribe(async () => {
        const partialAppState = await storage.load();
        Object.assign(applicationState, partialAppState);

        if (applicationState.currentPlaylist && applicationState.currentPlaylist.isRadio) {
            memoryStorage.trackIndex = createTrackIndex(applicationState.currentPlaylist);
        }

        if (applicationState.played && playerElement.paused) {
            await storage.played.set(false);
        }

        storage.listen((changes) => {
            Object.assign(applicationState, changes);
        });

        chrome.browserAction.setBadgeBackgroundColor({ color: "#0077FF" });
    });

fromEvent(playerElement, "error")
    .subscribe(() => { });

fromEvent(playerElement, "pause")
    .subscribe(async () => await storage.played.set(false));

fromEvent(playerElement, "playing")
    .subscribe(async () => {
        playerElement.volume = await storage.volume.get() || initialState.Application.volume;
        await storage.played.set(true);
        const track = applicationState.activeTrack;
        const deviceId = applicationState.deviceId;
        setTimeout(async () => {
            if (track) {
                await fetchers.startPlayback(track, deviceId);
            }
        }, 10);
    });

fromEvent(playerElement, "ended")
    .subscribe(async () => {
        sendListenedData(types.EndOfStreamReason.New);
        await storage.played.set(false);
        const repeat = await storage.repeat.get();
        if (repeat === types.EnumRepeat.REPEAT_ONE && applicationState.activeTrack && applicationState.currentPlaylist) {
            return await playNewTrack(applicationState.activeTrack.id, applicationState.currentPlaylist);
        }
        await nextTrack();
    });

const sendListenedData = (endStreamReason: types.EndOfStreamReason) => {
    if (applicationState.activeTrack && !applicationState.currentPlaylist?.isRadio) {
        const listenedData: types.TypeListenedDataFetchArgs = {
            userId: applicationState.userId,
            track: applicationState.activeTrack,
            listened: Math.floor(playerElement.currentTime),
            endStreamReason: endStreamReason,
        };
        setTimeout(async () => await fetchers.listenedData(listenedData), 10);
    }
};

fromEvent(playerElement, "timeupdate")
    .pipe(
        map(() => [playerElement.duration || 0, Math.floor(playerElement.currentTime)]),
        distinctUntilChanged((previous, current) => previous.toString() === current.toString()),
    )
    .subscribe(async ([duration, currentTime]) => {
        await storage.set({ duration: duration, currentTime: currentTime });

        if (window["browser"]) {
            chrome.browserAction.setBadgeText({ text: "►" });
            return
        }

        if (duration && duration !== Infinity) {
            chrome.browserAction.setBadgeText({ text: "-" + utils.toHHMMSS(duration - currentTime) });
        } else if (duration === Infinity) {
            chrome.browserAction.setBadgeText({ text: utils.toHHMMSS(currentTime) });
        }

    });

storage.volume.listen((volume: number | undefined) => {
    if (volume !== undefined) {
        playerElement.volume = volume;
    }
});

storage.played.listen(async (played: boolean | undefined) => {
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

});

const createTrackIndex = (playlist: types.TypeTitlePlaylist): Record<string, number> => {
    const trackIndex: Record<string, number> = {};
    playlist.tracks.forEach((track, index) => {
        trackIndex[track.id] = index;
    });
    return trackIndex;
};

storage.currentPlaylist.listen((playlist) => {
    if (playlist === undefined) {
        memoryStorage.trackIndex = {};
        return;
    }

    if (playlist.isRadio) {
        memoryStorage.trackIndex = createTrackIndex(playlist);
    }
});

const createAudiosIds = (playlist: types.TypeTitlePlaylist): types.TypeAudioIds => {
    const audiosIds: types.TypeAudioIds = {};
    playlist.tracks.forEach((track, index, array) => {
        audiosIds[track.id] = [
            track.accessKey,
            array[(index + 1) % array.length].id,
            array[(index || array.length) - 1].id,
            index === array.length - 1,
        ];
    });
    return audiosIds;
};

chrome.storage.local.get("currentPlaylist", async ({ currentPlaylist }) => {
    if (!currentPlaylist) {
        return;
    }
    await storage.audiosIds.set(createAudiosIds(currentPlaylist));
});

chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
    switch (request.type) {
        case "activeTrack": {
            if (request.data.playlist.isRadio) {
                return await playNewRadio(request.data.track, request.data.playlist);
            }
            sendListenedData(types.EndOfStreamReason.New);
            return await playNewTrack(request.data.track.id, request.data.playlist);
        }
        case "nextTrack": {
            sendListenedData(types.EndOfStreamReason.Next);
            await nextTrack();
            break;
        }
        case "previousTrack": {
            sendListenedData(types.EndOfStreamReason.Prev);
            await previousTrack();
            break;
        }
        case "currentTime": {
            playerElement.currentTime = request.data.value || 0;
            sendResponse();
            break;
        }
        default:
            break;
    }
});

const getActualAudiosIds = (trackId: string, playlist: types.TypeTitlePlaylist): [boolean, types.TypeAudioIds] => {
    const isNewPlaylist = (
        playlist.id !== applicationState.currentPlaylist?.id
        || playlist.ownerId !== applicationState.currentPlaylist?.ownerId
        || playlist.blockId !== applicationState.currentPlaylist?.blockId
    );

    let audiosIds = applicationState.audiosIds;
    if (isNewPlaylist || !audiosIds[trackId]) {
        audiosIds = createAudiosIds(playlist);
    }

    return [isNewPlaylist, audiosIds];
};

const reloadTrack = async () => {
    if (!applicationState.currentPlaylist || !applicationState.activeTrack) {
        return;
    }

    if (applicationState.currentPlaylist.isRadio) {
        return await playNewRadio(applicationState.activeTrack, applicationState.currentPlaylist);
    }

    await playNewTrack(applicationState.activeTrack.id, applicationState.currentPlaylist);
};

const playNewTrack = async (trackId: string, playlist: types.TypeTitlePlaylist) => {
    const [isNewPlaylist, audiosIds] = getActualAudiosIds(trackId, playlist);

    await __playNewSource(async () => {
        const [accessKey] = audiosIds[trackId];
        const track = await fetchers.trackInfo(applicationState.userId, trackId, accessKey);
        return [track, playlist, audiosIds];
    });

    if (isNewPlaylist) {
        const audiosIds = await fetchers.audiosIdsBySource(playlist);
        if (playlist.id === applicationState.currentPlaylist?.id
            && playlist.ownerId === applicationState.currentPlaylist?.ownerId
            && playlist.blockId === applicationState.currentPlaylist?.blockId) {

            await storage.audiosIds.set(audiosIds);
        }
    }
};

const playNewRadio = async (track: types.TypeTrackItem, playlist: types.TypeTitlePlaylist) => {
    const [_, audiosIds] = getActualAudiosIds(track.id, playlist);
    return await __playNewSource(async () => [track, playlist, audiosIds]);
};

const hlsWorkers: Array<Hls> = [];

const destroyPlayer = () => {
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

const __playNewSource = async (callback: Function) => {
    destroyPlayer();

    const [track, playlist, audiosIds] = await callback();

    if (applicationState.currentPlaylist?.blockId === playlist.blockId && applicationState.currentPlaylist?.id === playlist.id) {
        await storage.set({ activeTrack: track });
    } else {
        await storage.set({ activeTrack: track, currentPlaylist: playlist, audiosIds: audiosIds });
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

const nextTrack = async () => {
    if (applicationState.activeTrack && applicationState.currentPlaylist) {
        const nextTrackId = applicationState.audiosIds[applicationState.activeTrack.id][1];
        await playNewTrackByIndex(nextTrackId, applicationState.currentPlaylist);
    }
};

const previousTrack = async () => {
    if (applicationState.activeTrack && applicationState.currentPlaylist) {
        const previousTrackId = applicationState.audiosIds[applicationState.activeTrack.id][2];
        await playNewTrackByIndex(previousTrackId, applicationState.currentPlaylist);
    }
};

const playNewTrackByIndex = async (newTrackId: string, playlist: types.TypeTitlePlaylist) => {
    if (playlist.isRadio) {
        const newTrackIndex = memoryStorage.trackIndex[newTrackId];
        const nextTrack = playlist.tracks[newTrackIndex];
        await playNewRadio(nextTrack, playlist);
    } else {
        await playNewTrack(newTrackId, playlist);
    }
};

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
    const isChromeExtension = details.initiator && details.initiator.startsWith("chrome-extension://");
    const isFirefoxExtension = details["documentUrl"] && details["documentUrl"].startsWith("moz-extension://");

    if (!isChromeExtension && !isFirefoxExtension) {
        return;
    }

    if (!details.requestHeaders) {
        details.requestHeaders = [];
    }

    const origin = "https://vk.com"

    let originNotFound = true;
    details.requestHeaders
        .filter(header => header.name.toLowerCase() === "origin")
        .every(header => {
            header.value = origin;
            originNotFound = false;
        });

    if (originNotFound) {
        details.requestHeaders.push({ name: "origin", value: origin });
    }

    return { requestHeaders: details.requestHeaders };
},
    { urls: ["*://*.vk.com/*"], types: ["xmlhttprequest"] },
    window["browser"]
        ? ["blocking", "requestHeaders"]
        : ["blocking", "requestHeaders", "extraHeaders"]
);


chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        chrome.storage.local.clear();
    }
});
