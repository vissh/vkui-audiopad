import { baseTypes } from "@vk-audiopad/common";
import { EPlaylistDataType } from "./enums";

export type TCoverPlaylist = baseTypes.TTitlePlaylist & {
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

export type TCoverPlaylistBlock = {
    dataType: EPlaylistDataType.PLAYLISTS;
    title: string;
    blockId: string;
    playlists: TCoverPlaylist[];
    showAllLink: string;
};

export type TPlaylistBlock = TTrackPlaylistBlock | TCoverPlaylistBlock;
