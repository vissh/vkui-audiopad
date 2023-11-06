import { Icon28SongOutline, Icon32PauseCircle, Icon32PlayCircle } from "@vkontakte/icons";
import { Image } from "@vkontakte/vkui";
import { FC } from "react";
import { TTrackState } from "../model/types";

type TrackImageProps = {
    imageSrc: string;
    trackState: TTrackState;
    showOverlay?: boolean;
};

export const TrackImage: FC<TrackImageProps> = ({ imageSrc, trackState, showOverlay }) => {
    return (
        <Image
            src={imageSrc}
            loading={"lazy"}
        >
            {(showOverlay == undefined || showOverlay) && (
                <>
                    <PlayPauseIcon trackState={trackState} />
                    {!imageSrc && <Icon28SongOutline />}
                </>
            )}
        </Image>
    );
};

type PlayPauseIconProps = {
    trackState: TTrackState;
};

const PlayPauseIcon: FC<PlayPauseIconProps> = ({ trackState }) => {
    return (
        <Image.Overlay
            theme={trackState === "disabled" ? "light" : "dark"}
            visibility={
                trackState === "played" || trackState === "paused" || trackState === "disabled" ? "always" : "on-hover"
            }
        >
            <>
                {trackState === "played" && (
                    <Icon32PauseCircle
                        width={32}
                        height={32}
                        fill={"white"}
                    />
                )}
                {(trackState === "paused" || trackState === "normal") && (
                    <Icon32PlayCircle
                        width={32}
                        height={32}
                        fill={"white"}
                    />
                )}
            </>
        </Image.Overlay>
    );
};
