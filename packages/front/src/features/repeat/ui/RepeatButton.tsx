import { baseEnums } from "@vk-audiopad/common";
import { Icon24Repeat1Outline, Icon24RepeatOutline } from "@vkontakte/icons";
import { FC } from "react";
import { useAtomValue } from "shared/lib/atom";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";
import { repeatAtom } from "../model/atom";

export const RepeatButton: FC = () => {
    const repeat = useAtomValue(repeatAtom);

    const onClick = () => {
        chrome.runtime.sendMessage({ type: "repeat" });
    };

    return (
        <>
            {repeat === baseEnums.ERepeat.NONE && (
                <TooltipIconButton
                    padding
                    text="Повторять"
                    icon={Icon24RepeatOutline}
                    onClick={onClick}
                />
            )}
            {repeat === baseEnums.ERepeat.REPEAT && (
                <TooltipIconButton
                    accent
                    padding
                    text="Повторять композицию"
                    icon={Icon24RepeatOutline}
                    onClick={onClick}
                />
            )}
            {repeat === baseEnums.ERepeat.REPEAT_ONE && (
                <TooltipIconButton
                    accent
                    padding
                    text="Не повторять композицию"
                    icon={Icon24Repeat1Outline}
                    onClick={onClick}
                />
            )}
        </>
    );
};
