import { Icon24ShuffleOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom } from "../../../core/atom";
import { shuffleAtom } from "../../../core/atoms/storage";

export const ShuffleButton: FC = () => {
    const [shuffle, setShuffle] = useAtom(shuffleAtom);

    return (
        <WriteBarIcon
            style={shuffle ? { color: "var(--vkui--color_icon_accent_themed)" } : {}}
            onClick={() => setShuffle(!shuffle)}
        >
            <Icon24ShuffleOutline />
        </WriteBarIcon>
    );
};
