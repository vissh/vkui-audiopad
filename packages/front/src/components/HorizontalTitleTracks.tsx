import { baseTypes, utils } from "@vk-audiopad/common";
import { Group, HorizontalScroll, List } from "@vkontakte/vkui";
import { FC } from "react";
import { ShowAllTracksHeaderLink } from "./ShowAllTracksHeaderLink";
import { Track } from "./Track";

type HorizantalTitleTracksProps = {
    userId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export const HorizantalTitleTracks: FC<HorizantalTitleTracksProps> = ({ userId, playlist }) => {
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
            columns
        ));

    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {columnsTracks.map(tracksWithIndexes => (
                    <Group mode="plain">
                        <List style={{ width: 360 }}>
                            {tracksWithIndexes.map(([track, index]) =>
                                <Track
                                    key={track.id}
                                    playlist={playlist}
                                    track={track}
                                    trackIndex={index}
                                />
                            )}
                        </List>
                    </Group>
                ))}
            </div>
        </HorizontalScroll>
    );
};
