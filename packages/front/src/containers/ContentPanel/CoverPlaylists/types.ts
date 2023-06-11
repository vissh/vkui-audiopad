import { baseTypes } from "@vk-audiopad/common";

export type TFetchNextSectionArgs = {
    nextFrom: string;
    sectionId: string;
};

export type TFetchCoverPlaylistsResult = {
    nextFrom: string;
    sectionId: string;
    coverPlaylists: baseTypes.TCoverPlaylist[];
};
