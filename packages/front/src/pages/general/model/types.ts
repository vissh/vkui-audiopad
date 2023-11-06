import { baseTypes } from "@vk-audiopad/common";
import { TAlbum } from "shared/types";

export type TFetchGeneralResult = {
    playlist: baseTypes.TTitlePlaylist | null;
    baseOnYourTastes: TAlbum[];
    vkMusic: TAlbum[];
};
