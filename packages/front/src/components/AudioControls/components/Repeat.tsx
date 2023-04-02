import { api, types } from "@vk-audiopad/common";
import { Icon24Repeat, Icon24RepeatOne } from '@vkontakte/icons';
import { IconButton } from "@vkontakte/vkui";
import { FC } from "react";
import { useTypedSelector } from "../../../hooks/useTypedSelector";

export const Repeat: FC = () => {
    const { repeat } = useTypedSelector(state => state.application);

    const icon = {
        [types.EnumRepeat.NONE]:
            <Icon24Repeat
                style={{ color: 'var(--vkui--color_text_secondary)' }} />,

        [types.EnumRepeat.REPEAT]:
            <Icon24Repeat />,

        [types.EnumRepeat.REPEAT_ONE]:
            <Icon24RepeatOne />
    };

    return (
        <IconButton hasHover={false} onClick={async () => api.repeat()}>
            {icon[repeat]}
        </IconButton>
    );
};
