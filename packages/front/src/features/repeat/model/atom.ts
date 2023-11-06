import { initialState } from "@vk-audiopad/common";
import { storageAtom } from "shared/lib/atom";

export const repeatAtom = storageAtom("repeat", initialState.ApplicationControls.repeat);