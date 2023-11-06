import { baseTypes } from "@vk-audiopad/common";
import { TTrackState } from "entities/track";
import { useSetAtom } from "shared/lib/atom";
import { playedAtom } from "shared/model/storage-atoms";

export const playOrPause = (trackState: TTrackState, trackIndex: number, playlist: baseTypes.TTitlePlaylist) => {
    const setPlayed = useSetAtom(playedAtom);

    if (trackState === "played") {
        setPlayed(false);
        return;
    }

    if (trackState === "paused") {
        setPlayed(true);
        return;
    }

    chrome.runtime.sendMessage({ type: "activeTrack", data: { trackIndex: trackIndex, playlist: playlist } });
};
