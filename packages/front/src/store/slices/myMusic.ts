import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, types } from "@vk-audiopad/common";
import { initialMyMusicState } from "../initialState";

export const myMusicSlice = createSlice({
    name: "myMusic",
    initialState: initialMyMusicState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyAudios.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.fetchResult = null;
            })
            .addCase(fetchMyAudios.fulfilled, (state, action: PayloadAction<types.TypeMyMusicFetchResult>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchMyAudios.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "myMusic", error: action.error };
                state.loading = false;
                state.loaded = false;
            });

        builder
            .addCase(fetchMyTracksMore.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyTracksMore.fulfilled, (state, action: PayloadAction<types.TypePlaylistFetchResult>) => {
                if (state.fetchResult && state.fetchResult.playlist) {
                    const previousTracks = state.fetchResult.playlist.tracks;
                    state.fetchResult.playlist = action.payload.playlist;
                    state.fetchResult.playlist.tracks.unshift(...previousTracks);
                }
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchMyTracksMore.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = {
                    context: { name: "fetchMyTracksMore" },
                    error: action.error,
                };
                state.loading = false;
                state.loaded = false;
            });
    },
});

export const fetchMyAudios = createAsyncThunk(
    "vk/fetchMyAudios",
    async (ownerId: string) => await fetchers.myMusic(ownerId)
);

export const fetchMyTracksMore = createAsyncThunk(
    "vk/myTracksMore",
    async (playlist: types.TypeTitlePlaylist) => {
        return await fetchers.playlistMore(playlist)
    }
);