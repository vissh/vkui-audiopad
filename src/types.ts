
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
    title: string;
    authorLine: string;
}

export interface MyMusicFetchData {
    myAudios: ITrackItem[];
    recentAudios: ITrackItem[];
}

export interface GeneralFetchData {
    myAudios: ITrackItem[];
    baseOnYourTastes: ICoverPlaylist[];
}
