import { baseTypes } from "@vk-audiopad/common";
import { Icon20Check, Icon24DoneOutline } from "@vkontakte/icons";
import { FC } from "react";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";
import { vkApiDelete } from "../api/delete";

type DeleteFromMyMusicButtonProps = {
    track: baseTypes.TTrackItem;
    size?: "s" | "m";
    onAfterDelete: () => void;
};

export const DeleteFromMyMusicButton: FC<DeleteFromMyMusicButtonProps> = ({ track, size = "m", onAfterDelete }) => {
    const Icon = {
        s: Icon20Check,
        m: Icon24DoneOutline,
    }[size];

    const padding = {
        s: false,
        m: true,
    }[size];

    return (
        <TooltipIconButton
            padding={padding}
            text="Удалить аудиозапись"
            icon={Icon}
            onClick={async () => {
                await vkApiDelete(track);
                onAfterDelete();
            }}
        />
    );
};
