import { Group, PanelHeader } from "@vkontakte/vkui";
import React, { FC } from "react";
import { CurrentTime } from "./components/CurrentTime";
import { CurrentTrack } from "./components/CurrentTrack";
import { Info } from "./components/Info";
import { Next } from "./components/Next";
import { PlayPause } from "./components/PlayPause";
import { Previous } from "./components/Previous";
import { Repeat } from "./components/Repeat";
import { Shuffle } from "./components/Shuffle";
import { TrackIcon } from "./components/TrackIcon";
import { Volume } from "./components/Volume";

export const AudioControls: FC = () => {
    return (
        <PanelHeader
            before={
                <React.Fragment>
                    <PlayPause />
                    <Previous />
                    <Next />
                    <TrackIcon />
                </React.Fragment>
            }
            after={
                <React.Fragment>
                    <CurrentTime />
                    <Volume />
                    <Shuffle />
                    <Repeat />
                    <Info />
                </React.Fragment>
            }
        >
            <CurrentTrack />
        </PanelHeader>
    );
};
