import { initialState } from "@vk-audiopad/common";
import { storageAtom } from "shared/lib/atom";

export const shuffleAtom = storageAtom("shuffle", initialState.ApplicationControls.shuffle);
