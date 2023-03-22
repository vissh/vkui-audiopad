import { storage, types } from "@vk-audiopad/common";
import { Icon24Repeat, Icon24RepeatOne } from '@vkontakte/icons';
import React, { FC } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";

export const RepeatButton: FC = () => {
    const { repeat } = useTypedSelector(state => state.application);

    return (
        <React.Fragment>
            {repeat === types.EnumRepeat.NONE && (
                <Icon24Repeat
                    style={{ cursor: "pointer", color: 'var(--vkui--color_text_secondary)' }}
                    onClick={async () => { await storage.repeat.set(types.EnumRepeat.REPEAT) }}
                />
            )}
            {repeat === types.EnumRepeat.REPEAT && (
                <Icon24Repeat
                    style={{ cursor: "pointer" }}
                    onClick={async () => { await storage.repeat.set(types.EnumRepeat.REPEAT_ONE) }}
                />
            )}
            {repeat === types.EnumRepeat.REPEAT_ONE && (
                <Icon24RepeatOne
                    style={{ cursor: "pointer" }}
                    onClick={async () => { await storage.repeat.set(types.EnumRepeat.NONE) }}
                />
            )}
        </React.Fragment>
    );
};
