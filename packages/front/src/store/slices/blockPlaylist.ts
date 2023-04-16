import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, types } from "@vk-audiopad/common";
import { initialBlockPlaylistState } from "../initialState";

export const blockPlaylist = createSlice({
    name: "blockPlaylist",
    initialState: initialBlockPlaylistState,
    reducers: {
        resetState: (state) => {
            Object.assign(state, initialBlockPlaylistState);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPlaylist.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.fetchResult = null;
            })
            .addCase(fetchPlaylist.fulfilled, (state, action: PayloadAction<types.TypePlaylistFetchResult>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchPlaylist.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "blockPlaylist", error: action.error };
                state.loading = false;
                state.loaded = false;
            });

        builder
            .addCase(fetchPlaylistMore.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlaylistMore.fulfilled, (state, action: PayloadAction<types.TypePlaylistFetchResult>) => {
                if (state.fetchResult) {
                    const previousTracks = state.fetchResult.playlist.tracks;
                    state.fetchResult = action.payload;
                    state.fetchResult.playlist.tracks.unshift(...previousTracks);
                }
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchPlaylistMore.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "blockPlaylistMore", error: action.error };
                state.loading = false;
                state.loaded = false;
            });
    },
});

export const fetchPlaylist = createAsyncThunk(
    "vk/Playlist",
    async (fetchArgs: types.TypePlaylistFetchArguments) => await fetchers.playlist(fetchArgs)
);

export const fetchPlaylistMore = createAsyncThunk(
    "vk/playlistMore",
    async (playlist: types.TypeTitlePlaylist) => {
        return await fetchers.playlistMore(playlist)
    }
);
