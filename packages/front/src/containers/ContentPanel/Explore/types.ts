import { baseTypes } from "@vk-audiopad/common";

export type TFetchMoreExploreArgs = {
    nextFrom: string;
    sectionId: string;
};

export type TFetchExploreResult = {
    nextFrom: string;
    sectionId: string;
    playlists: baseTypes.TTitlePlaylist[];
};
