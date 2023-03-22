import { api, storage, utils } from "@vk-audiopad/common";
import { Icon20SkipBack, Icon20SkipForward, Icon28PauseCircle, Icon28PlayCircle, Icon28SongOutline } from "@vkontakte/icons";
import { IconButton, Image, PanelHeader, Separator, SimpleCell } from "@vkontakte/vkui";
import React, { FC } from "react";

import { useTypedSelector } from "../hooks/useTypedSelector";
import { Artist } from "./base/Artist";
import { BetaInfoTooltip } from "./base/BetaInfoTooltip";
import { Duration } from "./base/Duration";
import { RepeatButton } from "./base/RepeatButton";
import { VolumeSlider } from "./base/VolumeSlider";

export const AudioControls: FC = () => {
    const { activeTrack, played, duration, currentTime } = useTypedSelector(state => state.application);

    const playClick = async () => await storage.set({ played: !played });

    return (
        <PanelHeader
            before={
                <React.Fragment>
                    <IconButton hasHover={false}>
                        {played
                            ? <Icon28PauseCircle onClick={playClick} />
                            : <Icon28PlayCircle onClick={playClick} />}
                    </IconButton>
                    <IconButton hasHover={false}>
                        <Icon20SkipBack onClick={api.prevTrack} />
                    </IconButton>
                    <IconButton hasHover={false}>
                        <Icon20SkipForward onClick={api.nextTrack} />
                    </IconButton>
                </React.Fragment>
            }
            after={
                <React.Fragment>
                    <VolumeSlider />
                    <Separator />
                    <RepeatButton />
                    <Separator />
                    <BetaInfoTooltip />
                    <Separator />
                </React.Fragment>
            }
        >
            <SimpleCell
                hasHover={false}
                hasActive={false}
                before={activeTrack
                    && (activeTrack.image
                        ? <Image src={activeTrack.image} />
                        : <Image><Icon28SongOutline /></Image>)}
                after={<Duration value={duration ? "-" + utils.toHHMMSS(duration - currentTime) : ""} />}
                subtitle={<Artist value={activeTrack?.artist || ""} />}
            >
                {activeTrack?.title}
            </SimpleCell>
        </PanelHeader>
    );
};
