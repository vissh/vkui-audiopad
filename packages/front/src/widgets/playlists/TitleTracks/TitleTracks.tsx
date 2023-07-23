import { baseTypes } from "@vk-audiopad/common";
import { Group, Header } from "@vkontakte/vkui";
import { Track } from "entities/track";
import { FC } from "react";

type TitleTracksProps = {
    playlist: baseTypes.TTitlePlaylist;
};

export const TitleTracks: FC<TitleTracksProps> = ({ playlist }) => {
    return (
        <Group
            mode="plain"
            header={<Header>{playlist.title}</Header>}
        >
            {playlist.tracks.map((track, index) => (
                <Track
                    key={track.id}
                    playlist={playlist}
                    track={track}
                    trackIndex={index}
                />
            ))}
        </Group>
    );
};
