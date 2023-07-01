import { baseTypes } from "@vk-audiopad/common";
import Hls from "hls.js";
import { playerElement } from "./state";

const hlsWorkers: Array<Hls> = [];

export const playTrack = (track: baseTypes.TTrackItem) => {
    if (!track.url.includes("index.m3u8")) {
        playerElement.src = track.url;
        playerElement.play();
        return;
    }

    const hls = new Hls({
        maxBufferHole: 3,
        nudgeOffset: .5,
        nudgeMaxRetry: 5,
        maxFragLookUpTolerance: .2
    });
    hlsWorkers.push(hls);
    hls.loadSource(track.url);
    hls.attachMedia(playerElement);
    hls.on(Hls.Events.MEDIA_ATTACHED, async () => { playerElement.play() });
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
