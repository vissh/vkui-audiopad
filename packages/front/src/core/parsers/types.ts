import { EPlaylistDataType } from "../types/enums";

export type THtmlPlaylistInfo = {
    id: string;
    subtitle: string;
};

export type THtmlPlaylistBlock = {
    blockId: string;
    title: string;
    dataType: EPlaylistDataType;
    showAllLink: string;
    coverPlaylists: THtmlPlaylistInfo[];
};
