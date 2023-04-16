import { types } from "@vk-audiopad/common";
import { Group } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";
import { Track } from "./Track";

type Props = {
    playlist: types.TypeTitlePlaylist;
    tracksWithIndexes?: Array<[types.TypeTrackItem, number]>;
    style?: CSSProperties;
};

export const TrackList: FC<Props> = ({ playlist, tracksWithIndexes, style }) => {
    const arr = tracksWithIndexes || playlist.tracks.map((track, index) => [track, index]);
    return (
        <Group style={style} mode="plain" separator="hide">
            {arr.map(([track, index]) => <Track playlist={playlist} track={track} trackIndex={index} />)}
        </Group>
    );
};
