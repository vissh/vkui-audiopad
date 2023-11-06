import { initialState } from "@vk-audiopad/common";
import { atom, storageAtom, useSetAtom } from "shared/lib/atom";
import { EModalPage } from "./types";

export const activeModalPageAtom = atom<EModalPage | null>(null);

export const themeAtom = storageAtom("theme", initialState.ApplicationSettings.theme);
export const hlsDebugAtom = storageAtom("hlsDebug", initialState.PlaylistSystem.hlsDebug);

export const activateInfoModal = () => {
    const setActiveModal = useSetAtom(activeModalPageAtom);
    setActiveModal(EModalPage.INFO);
}
