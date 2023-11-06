import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { TActionButton, TTrackState } from "entities/track";
import { useAtomValue } from "shared/lib/atom";
import { activeTrackAtom, playedAtom } from "shared/model/storage-atoms";

export const getTrackState = (track: baseTypes.TTrackItem): TTrackState => {
    const activeTrack = useAtomValue(activeTrackAtom);
    const played = useAtomValue(playedAtom);

    const isActive = !!(activeTrack && activeTrack.id === track.id);
    const isPlayed = !!(isActive && played);
    const isClaimed = !!(track.flags & baseEnums.EAudioFlagBit.CLAIMED);
    return isClaimed ? "disabled" : isActive ? (isPlayed ? "played" : "paused") : "normal";
};

type ActionButtonArgs = {
    userId: string;
    track: baseTypes.TTrackItem;
    trackState: TTrackState;
    activeTrack: baseTypes.TTrackItem | null;
    currentPlaylistExists: boolean;
    addedToMyMusic: boolean;
    deletedFromMyMusic: boolean;
};

export const getActionButtons = ({
    userId,
    track,
    trackState,
    activeTrack,
    currentPlaylistExists,
    addedToMyMusic,
    deletedFromMyMusic,
}: ActionButtonArgs): Set<TActionButton> => {
    const trackUserId = track.id.split("_")[0];
    const isOwner = trackUserId === userId;
    const canAdd = !!(track && track.flags & baseEnums.EAudioFlagBit.CAN_ADD);

    const actionButtons: Set<TActionButton> = new Set();

    if (deletedFromMyMusic) {
        actionButtons.add("restore");
    } else if (trackState !== "disabled") {
        if (currentPlaylistExists && activeTrack?.id !== track.id && track.duration) {
            actionButtons.add("addToQueue")
        }

        if (isOwner) {
            actionButtons.add(addedToMyMusic ? "delete" : "deleteWithRestore");
        } else if (canAdd) {
            actionButtons.add("add");
        }

        if (track.duration) {
            actionButtons.add("similar");
        }
    }

    return actionButtons;
};
