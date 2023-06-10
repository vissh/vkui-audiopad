import { baseTypes } from "@vk-audiopad/common";

export type TFetchMyMusicResult = {
    playlist: baseTypes.TTitlePlaylist | null;
    recentTracksPlaylist: baseTypes.TTitlePlaylist | null;
    coverPlaylists: baseTypes.TCoverPlaylist[];
};
