import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, types } from "@vk-audiopad/common";
import { initialCoverPlaylistsState } from "../initialState";

export const coverPlaylists = createSlice({
    name: "coverPlaylists",
    initialState: initialCoverPlaylistsState,
    reducers: {
        resetState: (state) => {
            Object.assign(state, initialCoverPlaylistsState);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCoverPlaylists.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.fetchResult = null;
            })
            .addCase(fetchCoverPlaylists.fulfilled, (state, action: PayloadAction<types.TypeCoverPlaylistsFetchResult>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchCoverPlaylists.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "coverPlaylists", error: action.error };
                state.loading = false;
                state.loaded = false;
            });

        builder
            .addCase(fetchCoverPlaylistsMore.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCoverPlaylistsMore.fulfilled, (state, action: PayloadAction<types.TypeCoverPlaylistsFetchResult>) => {
                if (state.fetchResult) {
                    const previousCoverPlaylists = state.fetchResult.coverPlaylists;
                    state.fetchResult = action.payload;
                    state.fetchResult.coverPlaylists.unshift(...previousCoverPlaylists);
                }
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchCoverPlaylistsMore.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "coverPlaylistsMore", error: action.error };
                state.loading = false;
                state.loaded = false;
            });
    },
});

export const fetchCoverPlaylists = createAsyncThunk(
    "vk/coverPlaylists",
    async (fromId: string) => await fetchers.coverPlaylists(fromId)
);

export const fetchCoverPlaylistsMore = createAsyncThunk(
    "vk/coverPlaylistsMore",
    async (args: types.TypeNextSectionFetchArgs) => {
        return await fetchers.coverPlaylistsMore(args)
    }
);
