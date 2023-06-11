import { ModalRoot } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom } from "../../core/atom";
import { activeModalPageAtom } from "../../core/atoms";
import { EModalPage } from "../../core/types";
import { InfoModalPage } from "./InfoModalPage";

export const Modal: FC = () => {
    const [activeModal, setActiveModal] = useAtom(activeModalPageAtom);

    return (
        <ModalRoot
            activeModal={activeModal}
            onOpen={() => document.body.style.position = "unset"} // TODO: Genius!
            onClose={() => setActiveModal(null)}
        >
            <InfoModalPage id={EModalPage.INFO} dynamicContentHeight />
        </ModalRoot>
    );
};
