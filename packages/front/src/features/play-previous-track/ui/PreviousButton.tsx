import { Icon20SkipBack } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";

export const PreviousButton: FC = () => {
    return (
        <IconButton
            hasHover={false}
            onClick={() => chrome.runtime.sendMessage({ type: "previousTrack" })}
            style={{ height: 48 }}
        >
            <Icon20SkipBack />
        </IconButton>
    );
};
