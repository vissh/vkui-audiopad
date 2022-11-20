import { List } from "@vkontakte/vkui";
import { FC } from "react";

import { ITrackItem } from "../../types";
import { Track } from "./Track";

type TrackListProps = {
    tracks: ITrackItem[];
};

export const TrackList: FC<TrackListProps> = ({ tracks }) => {
    return (
        <List>
            {tracks.map(track => <Track track={track} />)}
        </List>
    );
};
