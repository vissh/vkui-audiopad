import { initialState } from "@vk-audiopad/common";
import { storageAtom } from "shared/lib/atom";

export const currentTimeAtom = storageAtom("currentTime", initialState.CurrentTime.currentTime);
export const durationAtom = storageAtom("duration", initialState.ApplicationActiveTrack.duration);
export const durationModeAtom = storageAtom("durationMode", initialState.ApplicationControls.durationMode);