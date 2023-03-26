import { Icon28SongOutline } from "@vkontakte/icons";
import { IconButton, Image, PanelHeader } from "@vkontakte/vkui";
import React, { FC } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { CurrentTime } from "./components/CurrentTime";
import { CurrentTrack } from "./components/CurrentTrack";
import { Info } from "./components/Info";
import { Next } from "./components/Next";
import { PlayPause } from "./components/PlayPause";
import { Previous } from "./components/Previous";
import { Repeat } from "./components/Repeat";
import { Shuffle } from "./components/Shuffle";
import { Volume } from "./components/Volume";

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
