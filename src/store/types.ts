import { ContentTab, ICatalogFetchData, IGeneralFetchData, IMyMusicFetchData, ITitlePlaylist, ITrackItem } from "../types";

export type TypeTabState = {
    selectedTab: ContentTab;
    customName: string;
    displayCurrentPlaylistTab: boolean;
}

export type TypeMyMusicState = {
    loading: boolean;
    loaded: boolean;
    data?: IMyMusicFetchData;
}

export type TypeGeneralState = {
    loading: boolean;
    loaded: boolean;
    data?: IGeneralFetchData;
}

export type TypeExploreState = {
    loading: boolean;
    loaded: boolean;
    playlists: ITitlePlaylist[];
};

export type TypeSearchTracksState = {
    loading: boolean;
    loaded: boolean;
    searchValue: string;
    tracks: ITrackItem[];
};

export type TypeCatalogTracksState = {
    loading: boolean;
    loaded: boolean;
    playlist?: ITitlePlaylist;
    data?: ICatalogFetchData;
};
