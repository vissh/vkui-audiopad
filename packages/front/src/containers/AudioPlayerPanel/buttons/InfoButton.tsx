import { Icon24InfoCircleOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC } from "react";
import { useSetAtom } from "../../../core/atom";
import { activeModalPageAtom } from "../../../core/atoms/modal";
import { EModalPage } from "../../../core/types";

export const InfoButton: FC = () => {
    const setActiveModal = useSetAtom(activeModalPageAtom);

    return (
        <WriteBarIcon onClick={() => setActiveModal(EModalPage.INFO)}>
            <Icon24InfoCircleOutline />
        </WriteBarIcon>
    );
};
