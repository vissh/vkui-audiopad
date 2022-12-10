
export enum ContentTab {
    CURRENT_PLAYLIST = "current-playlist",
    GENERAL = "general",
    MY_MUSIC = "my-music",
    EXPLORE = "explore",
    SEARCH = "search",
}

export interface ITrackItem {
    id: string;
    image: string;
    artist: string;
    title: string;
    duration: number;
}

export interface ICoverPlaylist {
    id: number;
    ownerId: number;
    coverUrl: string;
    gridCoverUrls: string[];
    title: string;
    authorLine: string;
    authorName: string;
}

export interface MyMusicFetchData {
    myTracks: ITrackItem[];
    recentTracks: ITrackItem[];
    myPlaylists: ICoverPlaylist[];
}

export interface GeneralFetchData {
    myTracks: ITrackItem[];
    recentTracks: ITrackItem[];
    baseOnYourTastes: ICoverPlaylist[];
}

export interface SearchFetchData {
    tracks: ITrackItem[];
}
