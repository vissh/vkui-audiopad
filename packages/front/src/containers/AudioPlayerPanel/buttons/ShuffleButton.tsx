import { Icon24ShuffleOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom } from "../../../core/atom";
import { shuffleAtom } from "../../../core/atoms";
import { sendEventControlButton } from "../../../core/top";

export const ShuffleButton: FC = () => {
    const [shuffle, setShuffle] = useAtom(shuffleAtom);

    const onClick = () => {
        setShuffle(!shuffle);
        sendEventControlButton("shuffle");
    };

    return (
        <WriteBarIcon
            style={shuffle ? { color: "var(--vkui--color_icon_accent_themed)" } : {}}
            onClick={onClick}
        >
            <Icon24ShuffleOutline />
        </WriteBarIcon>
    );
};
