import { baseTypes } from "@vk-audiopad/common";
import { Icon20Add, Icon24AddOutline } from "@vkontakte/icons";
import { FC } from "react";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";
import { vkApiAdd } from "../api/add";

type AddToMyMusicButtonProps = {
    track: baseTypes.TTrackItem;
    size?: "s" | "m";
    onAfterAdd: (newTrack: baseTypes.TTrackItem) => void;
};

export const AddToMyMusicButton: FC<AddToMyMusicButtonProps> = ({ track, size = "m", onAfterAdd }) => {
    const Icon = {
        s: Icon20Add,
        m: Icon24AddOutline,
    }[size];

    const padding = {
        s: false,
        m: true,
    }[size];

    return (
        <TooltipIconButton
            padding={padding}
            text="Добавить в мою музыку"
            icon={Icon}
            onClick={async () => {
                const newTrack = await vkApiAdd(track);
                onAfterAdd(newTrack);
            }}
        />
    );
};
