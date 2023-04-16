import { Icon24InfoCircleOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC } from "react";
import { useModalPageActions } from "../../../hooks/useActions";
import { EModalPage } from "../../../store/types";

export const Info: FC = () => {
    const { setActiveModal } = useModalPageActions();

    const onClick = () => {
        setActiveModal(EModalPage.INFO);
    };

    return (
        <WriteBarIcon onClick={onClick}>
            <Icon24InfoCircleOutline />
        </WriteBarIcon>
    );
};
