import { Icon20SkipBack } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { actions } from "../../../core/actions";

export const PreviousButton: FC = () => {
    return (
        <IconButton hasHover={false} onClick={actions.previousTrack} style={{ height: 48 }}>
            <Icon20SkipBack />
        </IconButton>
    );
};
