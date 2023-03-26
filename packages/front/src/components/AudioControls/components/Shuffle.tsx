import { Icon24Shuffle } from '@vkontakte/icons';
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";

export const Shuffle: FC = () => {
    return (
        <IconButton hasHover={false}><Icon24Shuffle /></IconButton>
    );
};
