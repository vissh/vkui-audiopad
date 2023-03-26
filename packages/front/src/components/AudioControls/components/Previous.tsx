import { api } from "@vk-audiopad/common";
import { Icon20SkipBack } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";

export const Previous: FC = () => {
    return (
        <IconButton hasHover={false} onClick={api.prevTrack} style={{ height: 48 }}>
            <Icon20SkipBack />
        </IconButton>
    );
};
