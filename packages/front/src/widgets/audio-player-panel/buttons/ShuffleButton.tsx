import { Icon24ShuffleOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { useAtom } from "shared/lib/atom";
import { FC } from "react";
import { shuffleAtom } from "shared/appAtoms";
import { sendEventControlButton } from "shared/lib/analytics";

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
