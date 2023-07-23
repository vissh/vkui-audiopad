import { Icon20SkipForward } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { actions } from "shared/lib/actions";
import { sendEventControlButton } from "shared/lib/analytics";

export const NextButton: FC = () => {
    const onClick = () => {
        actions.nextTrack();
        sendEventControlButton("nextTrack");
    };

    return (
        <IconButton
            hasHover={false}
            onClick={onClick}
            style={{ height: 48 }}
        >
            <Icon20SkipForward />
        </IconButton>
    );
};
