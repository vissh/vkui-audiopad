import { Icon24ShuffleOutline } from "@vkontakte/icons";
import { FC } from "react";
import { useAtom } from "shared/lib/atom";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";
import { shuffleAtom } from "../model/atom";

export const ShuffleButton: FC = () => {
    const [shuffle, setShuffle] = useAtom(shuffleAtom);

    const onClick = () => {
        setShuffle(!shuffle);
    };

    return (
        <>
            {shuffle ? (
                <TooltipIconButton
                    accent
                    padding
                    text="Перемешать"
                    icon={Icon24ShuffleOutline}
                    onClick={onClick}
                />
            ) : (
                <TooltipIconButton
                    padding
                    text="Перемешать"
                    icon={Icon24ShuffleOutline}
                    onClick={onClick}
                />
            )}
        </>
    );
};
