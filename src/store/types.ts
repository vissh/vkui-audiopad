import { ContentTab, ICoverPlaylist, ITrackItem } from "../types";

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
