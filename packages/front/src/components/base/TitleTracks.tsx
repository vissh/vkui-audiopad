import { types } from "@vk-audiopad/common";
import { Group, Header } from "@vkontakte/vkui";
import { FC } from "react";
import { TrackList } from "./TrackList";

type Props = {
    playlist: types.TypeTitlePlaylist;
};

export const TitleTracks: FC<Props> = ({ playlist }) => {
    return (
        <Group
            mode="plain"
            header={<Header mode="secondary">{playlist.title}</Header>}
        >
            <TrackList playlist={playlist} />
        </Group>
    );
};
