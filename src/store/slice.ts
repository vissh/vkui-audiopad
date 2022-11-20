import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ITrackItem } from '../types';
import { TypeCurrentPlaylistState } from './types';

const initialPlaylistState: TypeCurrentPlaylistState = {
    tracks: [],
    loading: true,
}


export const playlistSlice = createSlice({
    name: 'playlist',
    initialState: initialPlaylistState,
    // extraReducers под асинхронные запросы.
    reducers: {
        loading: (state) => {
            state.loading = true;
        },

        loaded: (state) => {
            state.loading = false;
        },

        setTracks: (state, action: PayloadAction<ITrackItem[]>) => {
            state.tracks = action.payload;
        },
    },
});
