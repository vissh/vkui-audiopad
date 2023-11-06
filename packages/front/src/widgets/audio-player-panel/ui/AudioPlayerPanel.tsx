import { PanelHeader } from "@vkontakte/vkui";
import { CurrentTimeButton } from "features/change-current-time";
import { VolumeSlider } from "features/change-volume";
import { NextButton } from "features/play-next-track";
import { PlayPauseButton } from "features/play-or-pause";
import { PreviousButton } from "features/play-previous-track";
import { FC } from "react";
import { Buttons } from "./Buttons";
import { CurrentTrackInfo } from "./CurrentTrackInfo";
import { TrackIcon } from "./TrackIcon";

export const AudioPlayerPanel: FC = () => {
    return (
        <PanelHeader
            before={
                <>
                    <PlayPauseButton />
                    <PreviousButton />
                    <NextButton />
                    <TrackIcon />
                </>
            }
            after={
                <>
                    <CurrentTimeButton />
                    <VolumeSlider />
                    <Buttons />
                </>
            }
        >
            <CurrentTrackInfo />
        </PanelHeader>
    );
};
