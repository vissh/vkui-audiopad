import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

import { blockPlaylist, exploreSlice, generalSlice, myMusicSlice, searchTracks, tabSlice } from "./slice";

const rootReducer = combineReducers({
    selectedTab: tabSlice.reducer,
    myMusic: myMusicSlice.reducer,
    general: generalSlice.reducer,
    explore: exploreSlice.reducer,
    search: searchTracks.reducer,
    blockPlaylist: blockPlaylist.reducer,
});

export const store = configureStore({
    reducer: rootReducer,
});

export type TypeRootState = ReturnType<typeof rootReducer>;
export const useAppDispatch = () => useDispatch<typeof store.dispatch>();
