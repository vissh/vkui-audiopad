import { ContentTab, IGeneralFetchData, IMyMusicFetchData, ITitlePlaylist, ITrackItem } from "../../types";

export type TypeTabState = {
    selectedTab: ContentTab;
    customName: string;
    displayCurrentPlaylistTab: boolean;
}

export type TypeMyMusicState = {
    loading: boolean;
    loaded: boolean;
    fetchResult: IMyMusicFetchData | null;
}

export type TypeGeneralState = {
    loading: boolean;
    loaded: boolean;
    fetchResult: IGeneralFetchData | null;
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

export type TypeBlockPlaylistState = {
    loading: boolean;
    loaded: boolean;
    playlist: ITitlePlaylist | null;
    fetchResult: ITitlePlaylist | null;
};
