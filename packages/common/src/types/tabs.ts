import { TTitlePlaylist } from "./base";
import { EContentTab } from "./enums";

export type TSelectedTabUnknown = {
    tab: EContentTab.UNKNOWN;
};

export type TSelectedTabSearch = {
    tab: EContentTab.SEARCH;
    value: string;
};

export type TSelectedTabArtist = {
    tab: EContentTab.ARTIST;
    id: string;
    name: string;
};

export type TSelectedTabPlaylist = {
    tab: EContentTab.BLOCK_PLAYLIST;
    fromId: string;
    playlist: TTitlePlaylist;
};

export type TSelectedTabCoverPlaylists = {
    tab: EContentTab.COVER_PLAYLISTS;
    showAllLink: string;
};

export type TClickableContentTabs = (
    EContentTab.CURRENT_PLAYLIST
    | EContentTab.GENERAL
    | EContentTab.MY_MUSIC
    | EContentTab.EXPLORE
);

export type TSelectedTabCommon = {
    tab: TClickableContentTabs;
};

export type TSelectedTabs = (
    TSelectedTabUnknown
    | TSelectedTabCommon
    | TSelectedTabSearch
    | TSelectedTabPlaylist
    | TSelectedTabCoverPlaylists
    | TSelectedTabArtist
);
