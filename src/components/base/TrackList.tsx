import { List } from "@vkontakte/vkui";
import { FC } from "react";

import { ITrackItem } from "../../types";
import { Track } from "./Track";

type TrackListProps = {
    tracks: ITrackItem[];
    cutText: boolean;
};

export const TrackList: FC<TrackListProps> = ({ tracks, cutText }) => {
    return (
        <List>
            {tracks.map(track => <Track track={track} cutText={cutText} />)}
        </List>
    );
};
