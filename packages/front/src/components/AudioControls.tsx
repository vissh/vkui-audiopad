import { Icon28SongOutline } from "@vkontakte/icons";
import { IconButton, Image, PanelHeader } from "@vkontakte/vkui";
import React, { FC } from "react";
import { useTypedSelector } from "../hooks/useTypedSelector";

import { CurrentTime } from "./base/audioControlComponents/CurrentTime";
import { CurrentTrack } from "./base/audioControlComponents/CurrentTrack";
import { Info } from "./base/audioControlComponents/Info";
import { Next } from "./base/audioControlComponents/Next";
import { PlayPause } from "./base/audioControlComponents/PlayPause";
import { Previous } from "./base/audioControlComponents/Previous";
import { Repeat } from "./base/audioControlComponents/Repeat";
import { Shuffle } from "./base/audioControlComponents/Shuffle";
import { Volume } from "./base/audioControlComponents/Volume";

export const AudioControls: FC = () => {
    const { activeTrack } = useTypedSelector(state => state.application);

    return (
        <PanelHeader
            before={
                <React.Fragment>
                    <PlayPause />
                    <Previous />
                    <Next />
                    <IconButton hasHover={false} hasActive={false} style={{ height: 48 }}>
                        {activeTrack
                            && (activeTrack.image
                                ? <Image src={activeTrack.image} />
                                : <Image><Icon28SongOutline /></Image>)}
                    </IconButton>
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
