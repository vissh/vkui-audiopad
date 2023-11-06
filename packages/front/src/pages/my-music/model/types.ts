import { baseTypes } from "@vk-audiopad/common";
import { TAlbum } from "shared/types";

export type TFetchMyMusicResult = {
    playlist: baseTypes.TTitlePlaylist | null;
    recentTracksPlaylist: baseTypes.TTitlePlaylist | null;
    radiostationsPlaylist: baseTypes.TTitlePlaylist | null;
    albums: TAlbum[];
};
