import { ITrackItem } from '../types';

export type TypeMyMusicState = {
    loading: boolean,
    recentlyPlayed: ITrackItem[],
    myTracks: ITrackItem[],
}

export type TypeSearchState = {
    loading: boolean,
    searchValue: string,
    tracks: ITrackItem[],
}
