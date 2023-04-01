import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, types } from "@vk-audiopad/common";
import { initialSearchTracksState } from "../initialState";

export const searchTracks = createSlice({
    name: "searchTracks",
    initialState: initialSearchTracksState,
    reducers: {
        setValue: (state, value: PayloadAction<string>) => {
            state.value = value.payload;
        },
        resetState: (state) => {
            Object.assign(state, initialSearchTracksState);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSearchTracks.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.fetchResult = null;
            })
            .addCase(fetchSearchTracks.fulfilled, (state, action: PayloadAction<types.TypeSearchFetchResult>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchSearchTracks.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "searchTracks", error: action.error };
                state.loading = false;
                state.loaded = false;
            });
    },
});

export const fetchSearchTracks = createAsyncThunk(
    "vk/searchTracks",
    async (fetchArgs: types.TypeSearchFetchArguments) => await fetchers.searchTracks(fetchArgs)
);
