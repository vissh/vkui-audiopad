import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { playlistSlice } from "./slice";


const rootReducer = combineReducers({
    playlist: playlistSlice.reducer,
});


export const store = configureStore({
    reducer: rootReducer,
});


export type TypeRootState = ReturnType<typeof rootReducer>;
