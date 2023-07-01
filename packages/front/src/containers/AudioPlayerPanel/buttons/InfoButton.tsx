import { Icon24InfoCircleOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC } from "react";
import { useSetAtom } from "../../../core/atom";
import { activeModalPageAtom } from "../../../core/atoms";
import { sendEventControlButton } from "../../../core/top";
import { EModalPage } from "../../../core/types/enums";

export const InfoButton: FC = () => {
    const setActiveModal = useSetAtom(activeModalPageAtom);

    const openInfo = () => {
        setActiveModal(EModalPage.INFO);
        sendEventControlButton("info");
    };

    return (
        <WriteBarIcon onClick={openInfo}>
            <Icon24InfoCircleOutline />
        </WriteBarIcon>
    );
};
