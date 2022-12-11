
import { ContentTab } from "../types";
import { TypeCatalogTracksState, TypeExploreState, TypeGeneralState, TypeMyMusicState, TypeSearchTracksState, TypeTabState } from "./types";


export const initialTabState: TypeTabState = {
    selectedTab: ContentTab.MY_MUSIC,
    customName: "",
    displayCurrentPlaylistTab: false,
}

export const initialGeneralState: TypeGeneralState = {
    loading: false,
    loaded: false,
}

export const initialMyMusicState: TypeMyMusicState = {
    loading: false,
    loaded: false,
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

export const initialCatalogTracksState: TypeCatalogTracksState = {
    loading: false,
    loaded: false,
};
