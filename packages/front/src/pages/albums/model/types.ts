import { TPlaylistBlock } from "shared/types";

export type TFetchNextSectionArgs = {
    nextFrom: string;
    sectionId: string;
};

export type TFetchAlbumsResult = {
    nextFrom: string;
    sectionId: string;
    playlistBlocks: TPlaylistBlock[];
};
