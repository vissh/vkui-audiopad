import { Icon28PauseCircle, Icon28PlayCircle } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom } from "../../../core/atom";
import { playedAtom } from "../../../core/atoms";
import { sendEventControlButton } from "../../../core/top";

export const PlayPauseButton: FC = () => {
    const [played, setPlayed] = useAtom(playedAtom);

    const onClick = () => {
        setPlayed(!played);
        sendEventControlButton(played ? "pause" : "play");
    };

    return (
        <IconButton
            hasHover={false}
            onClick={onClick}
            style={{ height: 48 }}>

            {played
                ? <Icon28PauseCircle />
                : <Icon28PlayCircle />}
        </IconButton>
    );
};
