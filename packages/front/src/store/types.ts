import { types } from "@vk-audiopad/common";

export type TypeTabState = {
    selectedTab: types.ContentTab;
    customName: string;
    displayCurrentPlaylistTab: boolean;
}

export type TypeMyMusicState = {
    loading: boolean;
    loaded: boolean;
    fetchResult: types.IMyMusicFetchData | null;
}

export type TypeGeneralState = {
    loading: boolean;
    loaded: boolean;
    fetchResult: types.IGeneralFetchData | null;
}

export type TypeExploreState = {
    loading: boolean;
    loaded: boolean;
    playlists: types.ITitlePlaylist[];
};

export type TypeSearchTracksState = {
    loading: boolean;
    loaded: boolean;
    searchValue: string;
    tracks: types.ITrackItem[];
};

export type TypeBlockPlaylistState = {
    loading: boolean;
    loaded: boolean;
    playlist: types.ITitlePlaylist | null;
    fetchResult: types.ITitlePlaylist | null;
};
