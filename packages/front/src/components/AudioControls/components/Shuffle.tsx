import { storage } from '@vk-audiopad/common';
import { Icon24Shuffle } from '@vkontakte/icons';
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { useTypedSelector } from '../../../hooks/useTypedSelector';

export const Shuffle: FC = () => {
    const { shuffle } = useTypedSelector(state => state.application);

    return (
        <IconButton
            hasHover={false}
            style={shuffle ? {} : { color: 'var(--vkui--color_text_secondary)' }}
            onClick={async () => await storage.shuffle.set(!shuffle)}
        >
            <Icon24Shuffle />
        </IconButton>
    );
};
