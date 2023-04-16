import { SerializedError } from "@reduxjs/toolkit";
import { types } from "@vk-audiopad/common";

export enum EModalPage {
    INFO = "info",
}

export type TModalPage = {
    activeModal: EModalPage | null;
};

type TypeFetchState = {
    loading: boolean;
    loaded: boolean;
    error: TypeFetchError | null;
};

export type TypeApplicationState = types.TypeApplicationState & TypeFetchState & {
    currentPlaylistExists: boolean | null;
    webTokenLoading: boolean;
    webTokenLoaded: boolean;
};

export type TypeFetchError = {
    context: any;
    error: SerializedError | null;
};

export type TypeMyMusicState = TypeFetchState & {
    fetchResult: types.TypeMyMusicFetchResult | null;
};

export type TypeGeneralState = TypeFetchState & {
    fetchResult: types.TypeGeneralFetchResult | null;
};

export type TypeExploreState = TypeFetchState & {
    fetchResult: types.TypeExploreFetchResult | null;
};

export type TypeSearchTracksState = TypeFetchState & {
    value: string;
    fetchResult: types.TypeSearchFetchResult | null;
};

export type TypePlaylistState = TypeFetchState & {
    fetchResult: types.TypePlaylistFetchResult | null;
};

export type TypeCoverPlaylistsState = TypeFetchState & {
    fetchResult: types.TypeCoverPlaylistsFetchResult | null;
};
