import { HorizontalScroll, List } from "@vkontakte/vkui";
import { FC } from "react";

import { ITrackItem } from "../types";
import { chunked } from "../utils";
import { Track } from "./Track";

type HorizontalTracksProps = {
    tracks: ITrackItem[];
    groupElementCount: number;
    groupLimit: number;
};

export const HorizantalTracks: FC<HorizontalTracksProps> = ({ tracks, groupElementCount, groupLimit }) => {
    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {Array.from(chunked(tracks, groupElementCount, groupLimit)).map(groupedTracks => (
                    <List>
                        {groupedTracks.map(track => <Track track={track} />)}
                    </List>
                ))}
            </div>
        </HorizontalScroll>
    );
};
