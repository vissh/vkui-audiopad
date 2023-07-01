import { baseEnums, utils } from "@vk-audiopad/common";
import { Button } from "@vkontakte/vkui";
import { FC } from "react";
import { Duration } from "../../../components/Duration";
import { useAtom, useAtomValue } from "../../../core/atom";
import {
    currentPlaylistAtom,
    currentTimeAtom,
    durationAtom,
    durationModeAtom,
    playedAtom,
} from "../../../core/atoms";
import { sendEventControlButton } from "../../../core/top";

export const CurrentTimeButton: FC = () => {
    const currentPlaylist = useAtomValue(currentPlaylistAtom);
    const duration = useAtomValue(durationAtom);
    const currentTime = useAtomValue(currentTimeAtom);

    const played = useAtomValue(playedAtom);
    const [durationMode, setDurationMode] = useAtom(durationModeAtom);
    const timeLeft = durationMode === baseEnums.EDurationMode.TIME_LEFT;

    const time = timeLeft ? duration - currentTime : currentTime;
    const value = utils.toHHMMSS(time);

    const onClick = () => {
        setDurationMode(timeLeft ? baseEnums.EDurationMode.TIME_PASSED : baseEnums.EDurationMode.TIME_LEFT);
        sendEventControlButton("currentTime");
    };

    return (
        <Button
            hasHover={false}
            mode="link"
            stretched
            style={{ width: "42px", color: "var(--vkui--color_text_secondary)" }}
            onClick={onClick}
            loading={currentPlaylist?.isRadio ? !currentTime : !duration && played}
        >
            <Duration value={duration && !currentPlaylist?.isRadio ? (timeLeft ? "-" + value : value) : utils.toHHMMSS(currentTime)} />
        </Button>
    );
};
