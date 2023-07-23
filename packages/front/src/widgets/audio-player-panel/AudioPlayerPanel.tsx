import { PanelHeader } from "@vkontakte/vkui";
import { FC } from "react";
import { CurrentTrackInfo } from "./CurrentTrackInfo";
import { TrackIcon } from "./TrackIcon";
import { AddButton } from "./buttons/AddButton";
import { CurrentTimeButton } from "./buttons/CurrentTimeButton";
import { InfoButton } from "./buttons/InfoButton";
import { NextButton } from "./buttons/NextButton";
import { PlayPauseButton } from "./buttons/PlayPauseButton";
import { PreviousButton } from "./buttons/PreviousButton";
import { RepeatButton } from "./buttons/RepeatButton";
import { ShuffleButton } from "./buttons/ShuffleButton";
import { VolumeSlider } from "./sliders/VolumeSlider";

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
                    <AddButton />
                    <ShuffleButton />
                    <RepeatButton />
                    {/* <SimilarButton /> */}
                    <InfoButton />
                </>
            }
        >
            <CurrentTrackInfo />
        </PanelHeader>
    );
};
