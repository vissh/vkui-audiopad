import { storage, utils } from "@vk-audiopad/common";
import { Button } from "@vkontakte/vkui";
import { FC } from "react";
import { useTypedSelector } from "../../../hooks/useTypedSelector";
import { Duration } from "../../base/Duration";

export const CurrentTime: FC = () => {
    const { currentPlaylist, duration, currentTime, durationReverse, played } = useTypedSelector(state => state.application);

    const time = durationReverse ? duration - currentTime : currentTime
    const value = utils.toHHMMSS(time);

    return (
        <Button
            hasHover={false}
            mode="link"
            stretched
            style={{ width: "42px", color: "var(--vkui--color_text_secondary)" }}
            onClick={async () => await storage.durationReverse.set(!durationReverse)}
            loading={currentPlaylist?.isRadio ? !currentTime : !duration && played}
        >
            <Duration value={duration && !currentPlaylist?.isRadio ? (durationReverse ? "-" + value : value) : utils.toHHMMSS(currentTime)} />
        </Button>
    );
};
