import { initialState } from "@vk-audiopad/common";
import { storageAtom } from "shared/lib/atom";

export const volumeAtom = storageAtom("volume", initialState.ApplicationControls.volume);