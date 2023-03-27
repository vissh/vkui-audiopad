import { fetchers, initialState, storage, types, utils } from "@vk-audiopad/common";
import Hls from "hls.js";
import { distinctUntilChanged, fromEvent, map } from "rxjs";

declare global {
    interface Window { applicationState: types.TypeApplicationState; }
}

const playerElement = document.getElementById("audio-player") as HTMLVideoElement;
const applicationState: types.TypeApplicationState = Object.assign({}, initialState.Application);
window.applicationState = applicationState;

fromEvent(document, "DOMContentLoaded")
    .subscribe(async () => {
        const partialAppState = await storage.load();
        Object.assign(applicationState, partialAppState);

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

        const [duration, currentTime] = [playerElement.duration || 0, Math.floor(playerElement.currentTime)];
        await storage.set({ played: true, duration: duration, currentTime: currentTime });

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
            return await playNewTrack(applicationState.activeTrackIndex);
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
            return;
        }

        if (applicationState) {
            setBadgeText(applicationState.durationReverse);
        }
    });

const setBadgeText = (durationReverse: boolean) => {
    const [duration, currentTime] = [playerElement.duration || 0, Math.floor(playerElement.currentTime)];

    if (duration && duration !== Infinity) {
        const time = durationReverse ? duration - currentTime : currentTime;
        const value = utils.toHHMMSS(time);
        chrome.browserAction.setBadgeText({ text: durationReverse ? "-" + value : value });
    } else if (duration === Infinity) {
        // radio
        if (applicationState) {
            chrome.browserAction.setBadgeText({ text: utils.toHHMMSS(currentTime) });
        }
    }
};

storage.durationReverse.listen((durationReverse: boolean | undefined) => {
    if (durationReverse !== undefined) {
        setBadgeText(durationReverse);
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

const createAudiosIds = (tracks: types.TypeTrackItem[]): Array<types.TypeAudioTuple> => {
    return tracks.map(track => [track.id, track.accessKey]);
};

chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
    switch (request.type) {
        case "activeTrack": {
            if (request.data.playlist.isRadio) {
                return await playNewRadio(request.data.trackIndex, request.data.playlist);
            }
            sendListenedData(types.EndOfStreamReason.New);
            return await playNewTrack(request.data.trackIndex, request.data.playlist);
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

const reloadTrack = async () => {
    if (!applicationState.currentPlaylist || !applicationState.activeTrack) {
        return;
    }

    if (applicationState.currentPlaylist.isRadio) {
        return await playNewRadio(applicationState.activeTrackIndex);
    }

    await playNewTrack(applicationState.activeTrackIndex);
};

const playNewTrack = async (trackIndex: number, playlist?: types.TypeTitlePlaylist) => {
    const audiosIds = playlist ? createAudiosIds(playlist.tracks) : applicationState.audiosIds;

    const trackFetcher = async () => {
        const [trackId, accessKey] = audiosIds[trackIndex] || audiosIds[0];
        const track = await fetchers.trackInfo(applicationState.userId, trackId, accessKey);
        return [track, trackIndex];
    };

    await __playNewSource(trackFetcher, playlist, audiosIds);

    if (playlist) {
        const audiosIds = await fetchers.audiosIdsBySource(playlist);
        if (playlist.id === applicationState.currentPlaylist?.id
            && playlist.ownerId === applicationState.currentPlaylist?.ownerId
            && playlist.blockId === applicationState.currentPlaylist?.blockId) {

            await storage.audiosIds.set(audiosIds);
        }
    }
};

const playNewRadio = async (trackIndex: number, playlist?: types.TypeTitlePlaylist) => {
    const fetchTrack = async () => {
        const tracks = playlist ? playlist.tracks : applicationState.currentPlaylist?.tracks || [];
        return [tracks[trackIndex], trackIndex]
    };

    return await __playNewSource(fetchTrack, playlist);
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

const __playNewSource = async (callback: Function, playlist?: types.TypeTitlePlaylist, audiosIds?: Array<types.TypeAudioTuple>) => {
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

const nextTrack = async () => await playNewTrackByIndex("next");
const previousTrack = async () => await playNewTrackByIndex("prev");

const getNewIndex = (action: "next" | "prev", index: number, length: number): number => {
    const value = action === "next" ? (index + 1) % length : (index || length) - 1;
    return value < 0 ? 0 : value;
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
