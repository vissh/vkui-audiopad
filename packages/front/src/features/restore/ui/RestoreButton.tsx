import { baseTypes } from "@vk-audiopad/common";
import { Icon20Add } from "@vkontakte/icons";
import { FC } from "react";
import { removeDeletedTrack } from "shared/lib/tracks";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";
import { vkApiRestore } from "../api/restore";

type RestoreButtonProps = {
    track: baseTypes.TTrackItem;
    onAfterRestore: () => void;
};

export const RestoreButton: FC<RestoreButtonProps> = ({ track, onAfterRestore }) => {
    return (
        <TooltipIconButton
            text="Восстановить аудиозапись"
            icon={Icon20Add}
            onClick={async () => {
                await vkApiRestore(track);
                removeDeletedTrack(track);
                onAfterRestore();
            }}
        />
    );
};
