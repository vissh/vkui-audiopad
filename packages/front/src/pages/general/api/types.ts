import { baseTypes } from "@vk-audiopad/common";
import { TCoverPlaylist } from "shared/types";

export type TFetchGeneralResult = {
    playlist: baseTypes.TTitlePlaylist | null;
    baseOnYourTastes: TCoverPlaylist[];
    vkMusic: TCoverPlaylist[];
};
