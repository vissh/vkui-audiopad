import { storage } from "@vk-audiopad/common";
import { Icon24Shuffle } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC } from "react";
import { useTypedSelector } from "../../../hooks/useTypedSelector";

export const Shuffle: FC = () => {
    const { shuffle } = useTypedSelector(state => state.application);

    return (
        <WriteBarIcon
            style={shuffle ? { color: "var(--vkui--color_icon_accent_themed)" } : {}}
            onClick={async () => await storage.shuffle.set(!shuffle)}
        >
            <Icon24Shuffle />
        </WriteBarIcon>
    );
};
