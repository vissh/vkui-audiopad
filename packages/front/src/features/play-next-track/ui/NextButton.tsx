import { Icon20SkipForward } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";

export const NextButton: FC = () => {
    return (
        <IconButton
            hasHover={false}
            onClick={() => chrome.runtime.sendMessage({ type: "nextTrack" })}
            style={{ height: 48 }}
        >
            <Icon20SkipForward />
        </IconButton>
    );
};
