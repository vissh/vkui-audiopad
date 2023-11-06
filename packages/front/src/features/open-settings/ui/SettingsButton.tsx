import { Icon24GearOutline } from "@vkontakte/icons";
import { activateInfoModal } from "entities/modal";
import { FC } from "react";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";

export const SettingButton: FC = () => {
    return (
        <TooltipIconButton
            padding
            text="Настройки"
            icon={Icon24GearOutline}
            onClick={activateInfoModal}
        />
    );
};
