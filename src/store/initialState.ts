
import { ContentTab } from "../types";
import { TypeGeneralState, TypeMyMusicState, TypeTabState } from "./types";


export const initialTabState: TypeTabState = {
    selectedTab: ContentTab.MY_MUSIC,
    customName: "",
    displayCurrentPlaylistTab: false,
}

export const initialGeneralState: TypeGeneralState = {
    loading: false,
    loaded: false,
    myTracks: [],
    recentTracks: [],
    baseOnYourTastes: [],
}

export const initialMyMusicState: TypeMyMusicState = {
    loading: false,
    loaded: false,
    myTracks: [],
    recentTracks: [],
    myPlaylists: [],
}
