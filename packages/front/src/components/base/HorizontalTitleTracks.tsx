import { types, utils } from "@vk-audiopad/common";
import { Group, HorizontalScroll } from "@vkontakte/vkui";
import { FC } from "react";

import { ShowAllTracksHeaderLink } from "./ShowAllTracksHeaderLink";
import { TrackList } from "./TrackList";

type HorizantalTitleTracksProps = {
    playlist: types.TypeTitlePlaylist;
};

export const HorizantalTitleTracks: FC<HorizantalTitleTracksProps> = ({ playlist }) => {
    return (
        <Group
            mode="plain"
            header={<ShowAllTracksHeaderLink playlist={playlist} />}
        >
            <HorizantalTracks playlist={playlist} />
        </Group>
    );
};


type HorizantalTracksProps = {
    playlist: types.TypeTitlePlaylist;
};

const HorizantalTracks: FC<HorizantalTracksProps> = ({ playlist }) => {
    const rows = 3;
    const columns = 6;
    const columnsTracks = Array.from(utils.chunked(playlist.tracks, rows, columns));

    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {columnsTracks.map(tracks => (
                    <Group mode="plain" separator="hide">
                        <TrackList playlist={playlist} tracks={tracks} style={{ width: 360 }} />
                    </Group>
                ))}
            </div>
        </HorizontalScroll>
    );
};
