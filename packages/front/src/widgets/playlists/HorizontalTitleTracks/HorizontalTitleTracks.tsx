import { baseTypes, utils } from "@vk-audiopad/common";
import { Group, HorizontalScroll, List } from "@vkontakte/vkui";
import { Track } from "entities/track";
import { FC } from "react";
import { ShowAllTracksHeaderLink } from "./ShowAllTracksHeaderLink";

type HorizontalTitleTracksProps = {
    userId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export const HorizontalTitleTracks: FC<HorizontalTitleTracksProps> = ({ userId, playlist }) => {
    return (
        <Group
            mode="plain"
            header={
                <ShowAllTracksHeaderLink
                    userId={userId}
                    playlist={playlist}
                />
            }
        >
            <HorizantalTracks playlist={playlist} />
        </Group>
    );
};

type HorizantalTracksProps = {
    playlist: baseTypes.TTitlePlaylist;
};

const HorizantalTracks: FC<HorizantalTracksProps> = ({ playlist }) => {
    const rows = 3;
    const columns = 6;
    const columnsTracks = Array.from(
        utils.chunked(
            playlist.tracks.map((track, index) => [track, index]),
            rows,
            columns,
        ),
    );

    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {columnsTracks.map((tracksWithIndexes) => (
                    <List style={{ width: 354, minWidth: 354 }}>
                        {tracksWithIndexes.map(([track, index]) => (
                            <Track
                                key={track.id}
                                playlist={playlist}
                                track={track}
                                trackIndex={index}
                            />
                        ))}
                    </List>
                ))}
            </div>
        </HorizontalScroll>
    );
};
