import { Icon28PauseCircle, Icon28PlayCircle } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom } from "../../../core/atom";
import { playedAtom } from "../../../core/atoms/storage";

export const PlayPauseButton: FC = () => {
    const [played, setPlayed] = useAtom(playedAtom);

    return (
        <IconButton
            hasHover={false}
            onClick={() => setPlayed(!played)}
            style={{ height: 48 }}>

            {played
                ? <Icon28PauseCircle />
                : <Icon28PlayCircle />}
        </IconButton>
    );
};
