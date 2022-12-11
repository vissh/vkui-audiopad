import { List } from "@vkontakte/vkui";
import { FC } from "react";

import { ITrackItem } from "../../types";
import { Track } from "./Track";

type TrackListProps = {
    tracks: ITrackItem[];
    compact?: boolean;
};

export const TrackList: FC<TrackListProps> = ({ tracks, compact }) => {
    return (
        <List>
            {tracks.map(track => <Track track={track} compact={compact} />)}
        </List>
    );
};
