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
    history: TSelectedTabs[];
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

export type TTabHistorable = (
    TSelectedTabCommon
    | TSelectedTabSearch
    | TSelectedTabArtist
);

export type TSelectedTabPlaylist = {
    tab: EContentTab.BLOCK_PLAYLIST;
    fromId: string;
    playlist: TTitlePlaylist;
    history: TSelectedTabs[];
};

export type TSelectedTabCoverPlaylists = {
    tab: EContentTab.COVER_PLAYLISTS;
    title: string;
    showAllLink: string;
    history: TSelectedTabs[];
};

export type TTabWithHistory = (
    TSelectedTabPlaylist
    | TSelectedTabCoverPlaylists
);

export type TSelectedTabs = (
    TSelectedTabUnknown
    | TSelectedTabCommon
    | TSelectedTabSearch
    | TSelectedTabPlaylist
    | TSelectedTabCoverPlaylists
    | TSelectedTabArtist
);

export const isTabWithHistory = (tab: TSelectedTabs): tab is TTabWithHistory => {
    return "history" in tab;
};
