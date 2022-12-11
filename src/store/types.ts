import { ContentTab, ExplorePlaylist, ICoverPlaylist, ITrackItem } from "../types";

export type TypeTabState = {
    selectedTab: ContentTab,
    customName: string,
    displayCurrentPlaylistTab: boolean,
}

export type TypeMyMusicState = {
    loading: boolean;
    loaded: boolean;
    myTracks: ITrackItem[],
    recentTracks: ITrackItem[],
    myPlaylists: ICoverPlaylist[];
}

export type TypeGeneralState = {
    loading: boolean;
    loaded: boolean;
    myTracks: ITrackItem[],
    recentTracks: ITrackItem[],
    baseOnYourTastes: ICoverPlaylist[];
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
