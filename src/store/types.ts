import { ContentTab, ExplorePlaylist, GeneralFetchData, ITrackItem, MyMusicFetchData } from "../types";

export type TypeTabState = {
    selectedTab: ContentTab,
    customName: string,
    displayCurrentPlaylistTab: boolean,
}

export type TypeMyMusicState = {
    loading: boolean;
    loaded: boolean;
    data?: MyMusicFetchData;
}

export type TypeGeneralState = {
    loading: boolean;
    loaded: boolean;
    data?: GeneralFetchData;
}

export type TypeExploreState = {
    loading: boolean;
    loaded: boolean;
    playlists: ExplorePlaylist[];
};

export type TypeSearchTracksState = {
    loading: boolean;
    loaded: boolean;
    searchValue: string;
    tracks: ITrackItem[],
}
