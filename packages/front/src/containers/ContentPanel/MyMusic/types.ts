import { baseTypes } from "@vk-audiopad/common";
import { TCoverPlaylist } from "../../../core/types/playlists";

export type TFetchMyMusicResult = {
    playlist: baseTypes.TTitlePlaylist | null;
    recentTracksPlaylist: baseTypes.TTitlePlaylist | null;
    radiostationsPlaylist: baseTypes.TTitlePlaylist | null;
    coverPlaylists: TCoverPlaylist[];
};
