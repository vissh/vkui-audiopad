import { TCoverPlaylist } from "../../../core/types/playlists";

export type TFetchNextSectionArgs = {
    nextFrom: string;
    sectionId: string;
};

export type TFetchCoverPlaylistsResult = {
    nextFrom: string;
    sectionId: string;
    coverPlaylists: TCoverPlaylist[];
};
