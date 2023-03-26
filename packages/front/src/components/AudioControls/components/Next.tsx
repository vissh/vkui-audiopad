import { api } from "@vk-audiopad/common";
import { Icon20SkipForward } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";

export const Next: FC = () => {
    return (
        <IconButton hasHover={false} onClick={api.nextTrack} style={{ height: 48 }}>
            <Icon20SkipForward />
        </IconButton>
    );
};
