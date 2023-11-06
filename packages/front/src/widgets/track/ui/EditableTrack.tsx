import { baseTypes } from "@vk-audiopad/common";
import { TrackCell } from "entities/track";
import { SearchArtist } from "features/search-artist";
import { FC } from "react";
import { getTrackState } from "../lib/utils";

type EditableTrackProps = {
    track: baseTypes.TTrackItem;
    trackIndex: number;
    onDragFinish: ({ from, to }: { from: number; to: number }) => void;
    onRemove: (index: number) => void;
};

export const EditableTrack: FC<EditableTrackProps> = ({ track, trackIndex, onDragFinish, onRemove }) => {
    const trackState = getTrackState(track);

    return (
        <TrackCell
            title={track.title}
            artist={<SearchArtist track={track} />}
            duration={0}
            image={track.image}
            trackState={trackState}
            editMode={true}
            onRemove={() => onRemove && onRemove(trackIndex)}
            onDragFinish={onDragFinish}
        />
    );
};
