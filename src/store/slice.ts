import { createSlice } from "@reduxjs/toolkit";
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

        setNewPlaylist: (state, action) => {
            state.loading = false;
            state.tracks = action.payload;
        },
    },
});
