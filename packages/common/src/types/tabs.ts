import { TTitlePlaylist } from "./base";
import { EContentTab } from "./enums";

export type TSelectedTabSearch = {
    tab: EContentTab.SEARCH;
    value: string;
};

export type TSelectedPlaylist = {
    tab: EContentTab.BLOCK_PLAYLIST;
    fromId: string;
    playlist: TTitlePlaylist;
};

export type TSelectedCoverPlaylists = {
    tab: EContentTab.COVER_PLAYLISTS;
    fromId: string;
};

export type TSelectedTabClickable = Exclude<EContentTab, EContentTab.SEARCH | EContentTab.BLOCK_PLAYLIST | EContentTab.COVER_PLAYLISTS>;

export type TSelectedTabCommon = {
    tab: TSelectedTabClickable;
};

export type TSelectedTabs = (
    TSelectedTabCommon
    | TSelectedTabSearch
    | TSelectedPlaylist
    | TSelectedCoverPlaylists
);
