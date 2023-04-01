import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, types } from "@vk-audiopad/common";
import { initialExploreState } from "../initialState";

export const exploreSlice = createSlice({
    name: "explore",
    initialState: initialExploreState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchExplore.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.fetchResult = null;
            })
            .addCase(fetchExplore.fulfilled, (state, action: PayloadAction<types.TypeExploreFetchResult>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchExplore.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "explore", error: action.error };
                state.loading = false;
                state.loaded = false;
            });

        builder
            .addCase(fetchExploreMore.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchExploreMore.fulfilled, (state, action: PayloadAction<types.TypeExploreFetchResult>) => {
                if (state.fetchResult) {
                    const previousPlaylists = state.fetchResult.playlists;
                    state.fetchResult = action.payload;
                    state.fetchResult.playlists.unshift(...previousPlaylists);
                }
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchExploreMore.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "fetchExploreMore", error: action.error };
                state.loading = false;
                state.loaded = false;
            });
    },
});

export const fetchExplore = createAsyncThunk(
    "vk/explore",
    async (ownerId: string) => await fetchers.explore(ownerId)
);

export const fetchExploreMore = createAsyncThunk(
    "vk/exploreMore",
    async (previousResult: types.TypeExploreFetchResult) => await fetchers.exploreMore(previousResult)
);