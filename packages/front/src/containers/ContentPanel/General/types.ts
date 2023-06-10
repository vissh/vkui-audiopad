import { baseTypes } from "@vk-audiopad/common";

export type TFetchGeneralResult = {
    playlist: baseTypes.TTitlePlaylist | null;
    baseOnYourTastes: baseTypes.TCoverPlaylist[];
};
