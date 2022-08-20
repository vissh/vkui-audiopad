import { createSlice } from "@reduxjs/toolkit";
import { TypePlaylistState } from "./types";


const initialPlaylistState: TypePlaylistState = {
    items: [],
    updating: false,
}


export const playlistSlice = createSlice({
    name: 'playlist',
    initialState: initialPlaylistState,
    // extraReducers под асинхронные запросы.
    reducers: {
        setUpdating: (state, action) => {
            state.updating = action.payload;
        },

        setNewPlaylist: (state, action) => {
            state.updating = false;
            state.items = action.payload;
        },
    },
});
