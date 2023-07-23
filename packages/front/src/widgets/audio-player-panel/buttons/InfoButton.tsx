import { Icon24InfoCircleOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { useSetAtom } from "shared/lib/atom";
import { FC } from "react";
import { activeModalPageAtom } from "shared/appAtoms";
import { sendEventControlButton } from "shared/lib/analytics";
import { EModalPage } from "shared/types";

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
