import { baseTypes } from "@vk-audiopad/common";

export type TFetchPlaylistArgs = {
    fromId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export type TFetchPlaylistResult = {
    playlist: baseTypes.TTitlePlaylist;
};
