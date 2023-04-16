import { initialState } from "@vk-audiopad/common";
import {
    TModalPage,
    TypeApplicationState,
    TypeCoverPlaylistsState,
    TypeExploreState,
    TypeGeneralState,
    TypeMyMusicState,
    TypePlaylistState,
    TypeSearchTracksState
} from "./types";

export const initialApplicationState: TypeApplicationState = {
    ...initialState.Application,
    currentPlaylistExists: null,
    webTokenLoading: false,
    webTokenLoaded: false,
    loading: false,
    loaded: false,
    error: null,
}

export const initialGeneralState: TypeGeneralState = {
    loading: true,
    loaded: false,
    error: null,
    fetchResult: null,
};

export const initialMyMusicState: TypeMyMusicState = {
    loading: true,
    loaded: false,
    error: null,
    fetchResult: null,
};

export const initialExploreState: TypeExploreState = {
    loading: true,
    loaded: false,
    error: null,
    fetchResult: null,
};

export const initialSearchTracksState: TypeSearchTracksState = {
    value: "",
    loading: true,
    loaded: false,
    error: null,
    fetchResult: null,
};

export const initialBlockPlaylistState: TypePlaylistState = {
    loading: true,
    loaded: false,
    error: null,
    fetchResult: null,
};

export const initialCoverPlaylistsState: TypeCoverPlaylistsState = {
    loading: true,
    loaded: false,
    error: null,
    fetchResult: null,
};

export const initialModalPageState: TModalPage = {
    activeModal: null,
};
