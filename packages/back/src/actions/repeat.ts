import { baseEnums } from "@vk-audiopad/common";
import { applicationState } from "../state";
import { storage } from "../storage";
import { sendListenedData } from "../utils";
import { playNewTrack } from "./play-new-track";

export const repeat = async () => {
    const nextMode = {
        [baseEnums.ERepeat.NONE]: baseEnums.ERepeat.REPEAT,
        [baseEnums.ERepeat.REPEAT]: baseEnums.ERepeat.REPEAT_ONE,
        [baseEnums.ERepeat.REPEAT_ONE]: baseEnums.ERepeat.NONE,
    };
    const value = applicationState.repeat || baseEnums.ERepeat.NONE;
    await storage.repeat.set(nextMode[value]);
};

export const playCurrentTrack = async () => {
    sendListenedData(baseEnums.EEndOfStreamReason.New);
    if (applicationState.activeTrack && applicationState.currentPlaylist) {
        await playNewTrack(applicationState.activeTrackIndex, applicationState.currentPlaylist);
    }
};
