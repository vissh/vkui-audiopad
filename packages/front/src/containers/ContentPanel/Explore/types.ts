import { TPlaylistBlock } from "../../../core/types/playlists";

export type TFetchMoreExploreArgs = {
    nextFrom: string;
    sectionId: string;
};

export type TFetchExploreResult = {
    nextFrom: string;
    sectionId: string;
    playlistBlocks: TPlaylistBlock[];
};
