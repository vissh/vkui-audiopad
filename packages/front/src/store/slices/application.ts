import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, storage, types } from "@vk-audiopad/common";
import { serializeError } from "serialize-error";
import { initialApplicationState } from "../initialState";

export const applicationSlice = createSlice({
    name: "application",
    initialState: initialApplicationState,
    reducers: {
        applyChanges: (state, changes: PayloadAction<Partial<types.TypeApplicationState>>) => {
            const newState: Partial<types.TypeApplicationState> = {};
            Object.entries(changes.payload).forEach(([key, value]) => {
                newState[key] = value === undefined ? initialApplicationState[key] : value;
            });
            Object.assign(state, newState);
            state.currentPlaylistExists = !!(state.currentPlaylist && state.currentPlaylist.tracks.length > 0);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadApplicationState.fulfilled, (state, appState: PayloadAction<Partial<types.TypeApplicationState>>) => {
                applicationSlice.caseReducers.applyChanges(state, appState);
            })
            .addCase(loadApplicationState.rejected, (_, action) => {
                console.error(action.error.stack);
            });

        builder
            .addCase(fetchCurrentPlaylistMore.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCurrentPlaylistMore.fulfilled, (state, action: PayloadAction<types.TypePlaylistFetchResult>) => {
                if (state.currentPlaylist) {
                    const previousTracks = state.currentPlaylist.tracks;
                    state.currentPlaylist = action.payload.playlist;
                    state.currentPlaylist.tracks.unshift(...previousTracks);
                }
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchCurrentPlaylistMore.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = {
                    context: { name: "fetchCurrentPlaylistMore" },
                    error: action.error,
                };
                state.loading = false;
                state.loaded = false;
            });

        builder
            .addCase(fetchAppWebToken.pending, (state) => {
                state.webTokenLoading = true;
                state.webTokenLoaded = false;
            })
            .addCase(fetchAppWebToken.fulfilled, (state) => {
                state.webTokenLoading = false;
                state.webTokenLoaded = true;
            })
            .addCase(fetchAppWebToken.rejected, (state) => {
                state.webTokenLoading = false;
                state.webTokenLoaded = true;
            });
    },
});

export const loadApplicationState = createAsyncThunk(
    "storage/load",
    async () => await storage.load()
);

export const fetchCurrentPlaylistMore = createAsyncThunk(
    "vk/currentPlaylistMore",
    async (playlist: types.TypeTitlePlaylist) => {
        return await fetchers.playlistMore(playlist)
    }
);

export const fetchAppWebToken = createAsyncThunk(
    "vk/appWebToken",
    async () => {
        try {
            const webToken = await fetchers.appWebToken();
            await storage.updateWebToken(webToken);
        } catch (err) {
            const webToken: types.TypeWebToken = {
                userId: "",
                accessToken: "",
                expires: 0,
                logoutHash: "",
                error: {
                    type: "exception",
                    serializedError: serializeError(err),
                }
            }
            await storage.updateWebToken(webToken);
        }
    }
);
