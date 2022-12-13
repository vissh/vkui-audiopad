import { HorizontalScroll } from "@vkontakte/vkui";
import { FC } from "react";

import { ITrackItem } from "../../../types";
import { chunked } from "../../../utils";
import { TrackList } from "./TrackList";

type HorizontalTracksProps = {
    tracks: ITrackItem[];
    groupElementCount: number;
    groupLimit: number;
};

export const HorizantalTracks: FC<HorizontalTracksProps> = ({ tracks, groupElementCount, groupLimit }) => {

    const columnsTracks = Array.from(chunked(tracks, groupElementCount, groupLimit));

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
