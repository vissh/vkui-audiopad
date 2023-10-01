import { ModalRoot } from "@vkontakte/vkui";
import { FC } from "react";
import { activeModalPageAtom } from "shared/appAtoms";
import { useAtom } from "shared/lib/atom";
import { EModalPage } from "shared/types";
import { InfoModalPage } from "./pages/InfoModalPage";

export const AppModalRoot: FC = () => {
    const [activeModal, setActiveModal] = useAtom(activeModalPageAtom);

    return (
        <ModalRoot
            activeModal={activeModal}
            onOpen={() => (document.body.style.position = "unset")} // TODO: Genius!
            onClose={() => setActiveModal(null)}
        >
            <InfoModalPage
                id={EModalPage.INFO}
                dynamicContentHeight
            />
        </ModalRoot>
    );
};
