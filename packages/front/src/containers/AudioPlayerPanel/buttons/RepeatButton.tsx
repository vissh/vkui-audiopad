import { baseEnums } from "@vk-audiopad/common";
import { Icon24Repeat1Outline, Icon24RepeatOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC } from "react";
import { actions } from "../../../core/actions";
import { useAtomValue } from "../../../core/atom";
import { repeatAtom } from "../../../core/atoms";
import { sendEventControlButton } from "../../../core/top";

export const RepeatButton: FC = () => {
    const repeat = useAtomValue(repeatAtom);

    const icon = {
        [baseEnums.ERepeat.NONE]:
            <Icon24RepeatOutline />,

        [baseEnums.ERepeat.REPEAT]:
            <Icon24RepeatOutline style={{ color: 'var(--vkui--color_icon_accent_themed)' }} />,

        [baseEnums.ERepeat.REPEAT_ONE]:
            <Icon24Repeat1Outline style={{ color: 'var(--vkui--color_icon_accent_themed)' }} />
    };

    const onClick = () => {
        actions.repeat();
        sendEventControlButton("repeat");
    };

    return (
        <WriteBarIcon onClick={onClick}>
            {icon[repeat]}
        </WriteBarIcon>
    );
};
