import { storage, types } from "@vk-audiopad/common";
import { Icon24Repeat, Icon24RepeatOne } from '@vkontakte/icons';
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { useTypedSelector } from "../../../hooks/useTypedSelector";

export const Repeat: FC = () => {
    const { repeat } = useTypedSelector(state => state.application);

    const icon = {
        [types.EnumRepeat.NONE]:
            <Icon24Repeat
                style={{ color: 'var(--vkui--color_text_secondary)' }}
                onClick={async () => await storage.repeat.set(types.EnumRepeat.REPEAT)}
            />,

        [types.EnumRepeat.REPEAT]:
            <Icon24Repeat
                onClick={async () => await storage.repeat.set(types.EnumRepeat.REPEAT_ONE)}
            />,

        [types.EnumRepeat.REPEAT_ONE]:
            <Icon24RepeatOne
                onClick={async () => await storage.repeat.set(types.EnumRepeat.NONE)}
            />
    };

    return (
        <IconButton hasHover={false}>
            {icon[repeat]}
        </IconButton>
    );
};
