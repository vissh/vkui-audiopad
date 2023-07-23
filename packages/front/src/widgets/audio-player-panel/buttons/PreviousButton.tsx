import { Icon20SkipBack } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { actions } from "shared/lib/actions";
import { sendEventControlButton } from "shared/lib/analytics";

export const PreviousButton: FC = () => {
    const onClick = () => {
        actions.previousTrack();
        sendEventControlButton("previousTrack");
    };

    return (
        <IconButton
            hasHover={false}
            onClick={onClick}
            style={{ height: 48 }}
        >
            <Icon20SkipBack />
        </IconButton>
    );
};
