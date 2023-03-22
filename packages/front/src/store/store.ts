import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

import {
    applicationSlice,
    blockPlaylist,
    coverPlaylists,
    exploreSlice,
    generalSlice,
    myMusicSlice,
    searchTracks
} from "./slice";

const rootReducer = combineReducers({
    application: applicationSlice.reducer,
    myMusic: myMusicSlice.reducer,
    general: generalSlice.reducer,
    explore: exploreSlice.reducer,
    search: searchTracks.reducer,
    blockPlaylist: blockPlaylist.reducer,
    coverPlaylists: coverPlaylists.reducer,
});

export const store = configureStore({
    reducer: rootReducer,
});

export type TypeRootState = ReturnType<typeof rootReducer>;
export const useAppDispatch = () => useDispatch<typeof store.dispatch>();
