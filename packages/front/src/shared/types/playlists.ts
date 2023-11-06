import { baseTypes } from "@vk-audiopad/common";
import { EPlaylistDataType } from "./enums";

export type TAlbum = baseTypes.TTitlePlaylist & {
    coverUrl: string;
    gridCoverUrls: string[];
    authorLine: string;
    authorName: string;
    infoLine: string;
};

export type TTrackPlaylistBlock = {
    dataType: EPlaylistDataType.TRACKS;
    playlist: baseTypes.TTitlePlaylist;
};

export type TAlbumsBlock = {
    dataType: EPlaylistDataType.ALBUMS;
    title: string;
    blockId: string;
    albums: TAlbum[];
    showAllLink: string;
};

export type TPlaylistBlock = TTrackPlaylistBlock | TAlbumsBlock;
