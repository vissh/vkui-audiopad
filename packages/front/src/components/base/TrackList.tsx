import { types } from "@vk-audiopad/common";
import { List } from "@vkontakte/vkui";
import { FC } from "react";

import { Track } from "./Track";

type Props = {
    tracks: types.ITrackItem[];
    compact?: boolean;
};

export const TrackList: FC<Props> = ({ tracks, compact }) => {
    return (
        <List>
            {tracks.map(track => <Track track={track} compact={compact} />)}
        </List>
    );
};
