import { types, utils } from "@vk-audiopad/common";
import { HorizontalScroll } from "@vkontakte/vkui";
import { FC } from "react";

import { TrackList } from "./TrackList";

type Props = {
    tracks: types.ITrackItem[];
    groupElementCount: number;
    groupLimit: number;
};

export const HorizantalTracks: FC<Props> = ({ tracks, groupElementCount, groupLimit }) => {

    const columnsTracks = Array.from(utils.chunked(tracks, groupElementCount, groupLimit));

    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {columnsTracks.map(columnTracks => (
                    <TrackList tracks={columnTracks} compact={true} />
                ))}
            </div>
        </HorizontalScroll>
    );
};
