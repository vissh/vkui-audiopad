import { baseTypes } from "@vk-audiopad/common";
import { Group, Header } from "@vkontakte/vkui";
import { FC } from "react";
import { Track } from "widgets/track";

type TrackListProps = {
    playlist: baseTypes.TTitlePlaylist;
    header?: string;
};

export const TrackList: FC<TrackListProps> = ({ playlist, header }) => {
    return (
        <Group
            mode="plain"
            header={header && <Header>{header}</Header>}
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
