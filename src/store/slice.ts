import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ITrackItem } from "../types";
import { TypeMyMusicState, TypeSearchState } from "./types";

const initialMyMusicState: TypeMyMusicState = {
    loading: true,
    recentlyPlayed: [],
    myTracks: [],
}

const initialSearchState: TypeSearchState = {
    loading: false,
    tracks: [],
    searchValue: "",
}


export const myMusicSlice = createSlice({
    name: "mymusic",
    initialState: initialMyMusicState,
    // extraReducers под асинхронные запросы.
    reducers: {
        setLoading: (state) => {
            state.loading = true;
        },

        setLoaded: (state) => {
            state.loading = false;
        },

        setRecentlyPlayed: (state, action: PayloadAction<ITrackItem[]>) => {
            state.recentlyPlayed = action.payload;
        },

        setMyTracks: (state, action: PayloadAction<ITrackItem[]>) => {
            state.myTracks = action.payload;
        },
    },
});


export const searchSlice = createSlice({
    name: "search",
    initialState: initialSearchState,
    reducers: {
        loading: (state) => {
            state.loading = true;
        },

        loaded: (state) => {
            state.loading = false;
        },

        setSearchValue: (state, action: PayloadAction<string>) => {
            state.searchValue = action.payload;
        },

        setTracks: (state, action: PayloadAction<ITrackItem[]>) => {
            state.tracks = action.payload;
        },
    },
});
