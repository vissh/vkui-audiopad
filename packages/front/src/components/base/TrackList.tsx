import { types } from "@vk-audiopad/common";
import { Group } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";

import { Track } from "./Track";

type Props = {
    playlist: types.TypeTitlePlaylist;
    tracks?: types.TypeTrackItem[];
    style?: CSSProperties;
};

export const TrackList: FC<Props> = ({ playlist, tracks, style }) => {
    const playlistTracks = tracks || playlist.tracks;
    return (
        <Group style={style} mode="plain" separator="hide">
            {playlistTracks.map(track => <Track playlist={playlist} track={track} />)}
        </Group>
    );
};
