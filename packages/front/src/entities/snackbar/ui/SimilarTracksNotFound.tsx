import { Icon28InfoCircleOutline } from "@vkontakte/icons";
import { Snackbar } from "@vkontakte/vkui";
import { FC } from "react";
import { useSetAtom } from "shared/lib/atom";
import { snackbarAtom } from "../model/atom";

export const SimilarTracksNotFound: FC = () => {
    const setSnackbar = useSetAtom(snackbarAtom);

    return (
        <Snackbar
            duration={3400}
            subtitle="Попробуйте другую аудиозапись"
            onClose={() => setSnackbar(null)}
            before={<Icon28InfoCircleOutline fill="var(--vkui--color_icon_accent)" />}
        >
            Мы не смогли найти ничего похожего
        </Snackbar>
    );
};
