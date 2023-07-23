import { Icon28PauseCircle, Icon28PlayCircle } from "@vkontakte/icons";
import { IconButton } from "@vkontakte/vkui";
import { useAtom } from "shared/lib/atom";
import { FC } from "react";
import { playedAtom } from "shared/appAtoms";
import { sendEventControlButton } from "shared/lib/analytics";

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
            style={{ height: 48 }}
        >
            {played ? <Icon28PauseCircle /> : <Icon28PlayCircle />}
        </IconButton>
    );
};
