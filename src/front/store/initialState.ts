
import { ContentTab } from "../../types";
import { TypeBlockPlaylistState, TypeExploreState, TypeGeneralState, TypeMyMusicState, TypeSearchTracksState, TypeTabState } from "./types";


export const initialTabState: TypeTabState = {
    selectedTab: ContentTab.MY_MUSIC,
    customName: "",
    displayCurrentPlaylistTab: false,
}

export const initialGeneralState: TypeGeneralState = {
    loading: false,
    loaded: false,
    fetchResult: null,
}

export const initialMyMusicState: TypeMyMusicState = {
    loading: false,
    loaded: false,
    fetchResult: null,
}

export const initialExploreState: TypeExploreState = {
    loading: false,
    loaded: false,
    playlists: [],
}

export const initialSearchTracksState: TypeSearchTracksState = {
    loading: false,
    loaded: false,
    searchValue: "",
    tracks: [],
}

export const initialBlockPlaylistState: TypeBlockPlaylistState = {
    loading: false,
    loaded: false,
    playlist: null,
    fetchResult: null,
};
