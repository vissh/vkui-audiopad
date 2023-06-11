import { baseTypes } from "@vk-audiopad/common";

export type TFetchSearchArgs = {
    ownerId: string;
    value: string;
};

export type TFetchSearchResult = {
    trackPlaylists: baseTypes.TTitlePlaylist[],
    officialAlbums: baseTypes.TCoverPlaylist[],
    otherPlaylists: baseTypes.TCoverPlaylist[],
};
