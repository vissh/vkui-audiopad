import { baseTypes } from "@vk-audiopad/common";
import { TCoverPlaylist } from "../../../core/types/playlists";

export type TFetchGeneralResult = {
    playlist: baseTypes.TTitlePlaylist | null;
    baseOnYourTastes: TCoverPlaylist[];
    vkMusic: TCoverPlaylist[];
};
