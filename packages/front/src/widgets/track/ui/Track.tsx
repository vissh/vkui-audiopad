import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { TrackCell } from "entities/track";
import { AddToMyMusicButton } from "features/add-to-my-music";
import { AddToQueueButton } from "features/add-to-queue";
import { DeleteFromMyMusicButton, DeleteFromMyMusicWithRestoreButton } from "features/delete-from-my-music";
import { playOrPause } from "features/play-or-pause";
import { RestoreButton } from "features/restore";
import { SearchArtist } from "features/search-artist";
import { SimilarButton } from "features/similar/ui/SimilarButton";
import { FC, useState } from "react";
import { useAtomValue } from "shared/lib/atom";
import { addDeletedTrack } from "shared/lib/tracks";
import { activeTrackAtom, currentPlaylistAtom, userIdAtom } from "shared/model/storage-atoms";
import { getActionButtons, getTrackState } from "../lib/utils";

type TrackProps = {
    playlist: baseTypes.TTitlePlaylist;
    track: baseTypes.TTrackItem;
    trackIndex: number;
};

export const Track: FC<TrackProps> = ({ playlist, track, trackIndex }) => {
    const userId = useAtomValue(userIdAtom);
    const currentPlaylist = useAtomValue(currentPlaylistAtom);
    const activeTrack = useAtomValue(activeTrackAtom);

    const originalTrack = track;

    var [track, setTrack] = useState(track);
    const [addedToMyMusic, setAddedToMyMusic] = useState(false);
    const [deletedFromMyMusic, setDeletedFromMyMusic] = useState(false);

    const trackState = getTrackState(track);

    const actionButtons = getActionButtons({
        userId,
        track,
        trackState,
        activeTrack,
        currentPlaylistExists: !!currentPlaylist,
        addedToMyMusic,
        deletedFromMyMusic,
    });

    return (
        <TrackCell
            title={track.title}
            artist={<SearchArtist track={track} />}
            duration={track.duration}
            image={track.image}
            trackState={trackState}
            onClick={() => {
                playOrPause(trackState, trackIndex, playlist);
            }}
            actions={
                <>
                    {actionButtons.has("similar") && (
                        <SimilarButton
                            size="s"
                            userId={userId}
                            track={track}
                        />
                    )}

                    {actionButtons.has("addToQueue") && <AddToQueueButton track={track} />}

                    {actionButtons.has("add") && (
                        <AddToMyMusicButton
                            size="s"
                            track={track}
                            onAfterAdd={(newTrack) => {
                                setAddedToMyMusic(true);
                                setTrack(newTrack);
                            }}
                        />
                    )}

                    {actionButtons.has("delete") && (
                        <DeleteFromMyMusicButton
                            size="s"
                            track={track}
                            onAfterDelete={() => {
                                addDeletedTrack(track);
                                setAddedToMyMusic(false);
                                setTrack(originalTrack);
                            }}
                        />
                    )}

                    {actionButtons.has("deleteWithRestore") && (
                        <DeleteFromMyMusicWithRestoreButton
                            track={track}
                            onAfterDelete={() => {
                                addDeletedTrack(track);
                                setTrack({ ...track, flags: track.flags | baseEnums.EAudioFlagBit.CLAIMED });
                                setDeletedFromMyMusic(true);
                            }}
                        />
                    )}

                    {actionButtons.has("restore") && (
                        <RestoreButton
                            track={track}
                            onAfterRestore={() => {
                                setTrack(originalTrack);
                                setDeletedFromMyMusic(false);
                            }}
                        />
                    )}
                </>
            }
        />
    );
};
