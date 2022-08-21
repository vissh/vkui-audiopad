import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ITrackItem } from "../types";
import { TypeCurrentPlaylistState } from "./types";


const initialPlaylistState: TypeCurrentPlaylistState = {
    tracks: [],
    loading: true,
}


export const playlistSlice = createSlice({
    name: 'playlist',
    initialState: initialPlaylistState,
    // extraReducers под асинхронные запросы.
    reducers: {
        setLoading: (state) => {
            state.loading = true;
            state.tracks = [];
        },

        setNewPlaylist: (state, action: PayloadAction<ITrackItem[]>) => {
            state.loading = false;
            state.tracks = action.payload;
        },
    },
});
