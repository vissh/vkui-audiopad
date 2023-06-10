import { baseTypes } from "@vk-audiopad/common";

export enum EModalPage {
    INFO = "info",
}

export type TLatestAddedTracks = {
    latestAddedTracks: Record<string, baseTypes.TTrackItem>;
};

export type TFetchPlaylistArgs = {
    fromId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export type TFetchPlaylistResult = {
    playlist: baseTypes.TTitlePlaylist;
};
