import { ModalRoot } from "@vkontakte/vkui";
import { FC } from "react";
import { useModalPageActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { EModalPage } from "../../store/types";
import { InfoModalPage } from "./InfoModalPage";

export const Modal: FC = () => {
    const { activeModal } = useTypedSelector(state => state.modalPage);
    const { setActiveModal } = useModalPageActions();

    const onOpen = () => {
        // TODO: Гений.
        document.body.style.position = "unset";
    };

    const onClose = () => {
        setActiveModal(null);
    };

    return (
        <ModalRoot
            activeModal={activeModal}
            onOpen={onOpen}
            onClose={onClose}
        >
            <InfoModalPage id={EModalPage.INFO} dynamicContentHeight />
        </ModalRoot>
    );
};
