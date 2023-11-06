import { baseTypes } from "@vk-audiopad/common";
import { Icon20ListAddOutline, Icon20ListPlayOutline } from "@vkontakte/icons";
import { FC, useState } from "react";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";

type AddToQueueButtonProps = {
    track: baseTypes.TTrackItem;
};

export const AddToQueueButton: FC<AddToQueueButtonProps> = ({ track }) => {
    const [added, setAdded] = useState(false);

    return (
        <>
            {added ? (
                <TooltipIconButton
                    text="Воспроизвести следующей"
                    icon={Icon20ListAddOutline}
                />
            ) : (
                <TooltipIconButton
                    text="Воспроизвести следующей"
                    icon={Icon20ListPlayOutline}
                    onClick={() => {
                        chrome.runtime.sendMessage({ type: "addToQueue", data: { track: track } });
                        setAdded(true);
                    }}
                />
            )}
        </>
    );
};
