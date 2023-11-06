import { baseTypes } from "@vk-audiopad/common";
import { Icon20Cancel } from "@vkontakte/icons";
import { FC } from "react";
import { addDeletedTrack } from "shared/lib/tracks";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";
import { vkApiDeleteWithRestore } from "../api/delete";

type DeleteFromMyMusicWithRestoreButtonProps = {
    track: baseTypes.TTrackItem;
    onAfterDelete: () => void;
};

export const DeleteFromMyMusicWithRestoreButton: FC<DeleteFromMyMusicWithRestoreButtonProps> = ({
    track,
    onAfterDelete,
}) => {
    return (
        <TooltipIconButton
            text="Удалить аудиозапись"
            icon={Icon20Cancel}
            onClick={async () => {
                await vkApiDeleteWithRestore(track);
                onAfterDelete();
            }}
        />
    );
};
