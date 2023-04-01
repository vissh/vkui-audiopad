import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { applicationSlice } from "./slices/application";
import { blockPlaylist } from "./slices/blockPlaylist";
import { coverPlaylists } from "./slices/coverPlaylist";
import { exploreSlice } from "./slices/explore";
import { generalSlice } from "./slices/general";
import { myMusicSlice } from "./slices/myMusic";
import { searchTracks } from "./slices/search";

const rootReducer = combineReducers({
    application: applicationSlice.reducer,
    blockPlaylist: blockPlaylist.reducer,
    coverPlaylists: coverPlaylists.reducer,
    explore: exploreSlice.reducer,
    general: generalSlice.reducer,
    myMusic: myMusicSlice.reducer,
    search: searchTracks.reducer,
});

export const store = configureStore({
    reducer: rootReducer,
});

export type TypeRootState = ReturnType<typeof rootReducer>;
export const useAppDispatch = () => useDispatch<typeof store.dispatch>();
