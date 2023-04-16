import { storage } from "@vk-audiopad/common";
import { Icon28PauseCircle, Icon28PlayCircle } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { useTypedSelector } from "../../../hooks/useTypedSelector";

export const PlayPause: FC = () => {
    const { played } = useTypedSelector(state => state.application);

    const playClick = async () => await storage.set({ played: !played });

    return (
        <IconButton hasHover={false} onClick={playClick} style={{ height: 48 }}>
            {played
                ? <Icon28PauseCircle />
                : <Icon28PlayCircle />}
        </IconButton>
    );
};
