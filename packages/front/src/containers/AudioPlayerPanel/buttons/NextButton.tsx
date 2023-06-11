import { Icon20SkipForward } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { actions } from "../../../core/actions";

export const NextButton: FC = () => {
    return (
        <IconButton hasHover={false} onClick={actions.nextTrack} style={{ height: 48 }}>
            <Icon20SkipForward />
        </IconButton>
    );
};
