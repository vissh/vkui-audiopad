import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, storage, types } from "@vk-audiopad/common";
import { serializeError } from "serialize-error";

import {
    initialApplicationState,
    initialBlockPlaylistState,
    initialCoverPlaylistsState,
    initialExploreState,
    initialGeneralState,
    initialMyMusicState,
    initialSearchTracksState
} from "./initialState";


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

export const generalSlice = createSlice({
    name: "general",
    initialState: initialGeneralState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchGeneral.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.fetchResult = null;
            })
            .addCase(fetchGeneral.fulfilled, (state, action: PayloadAction<types.TypeGeneralFetchResult>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
            })
            .addCase(fetchGeneral.rejected, (state, action) => {
                console.error(action.error.stack);
                state.error = { context: "general", error: action.error };
                state.loading = false;
                state.loaded = false;
            });
    },
});

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

export const setSelectedTab = createAsyncThunk(
    "storage/setSelectedTab",
    async (selectedTab: types.SelectedTabs) => await storage.set({ selectedTab: selectedTab })
);

export const loadApplicationState = createAsyncThunk(
    "storage/load",
    async () => await storage.load()
);

export const fetchMyAudios = createAsyncThunk(
    "vk/fetchMyAudios",
    async (ownerId: string) => await fetchers.myMusic(ownerId)
);

export const fetchGeneral = createAsyncThunk(
    "vk/fetchGeneral",
    async (ownerId: string) => await fetchers.general(ownerId)
);

export const fetchExplore = createAsyncThunk(
    "vk/explore",
    async (ownerId: string) => await fetchers.explore(ownerId)
);

export const fetchExploreMore = createAsyncThunk(
    "vk/exploreMore",
    async (previousResult: types.TypeExploreFetchResult) => await fetchers.exploreMore(previousResult)
);

export const fetchSearchTracks = createAsyncThunk(
    "vk/searchTracks",
    async (fetchArgs: types.TypeSearchFetchArguments) => await fetchers.searchTracks(fetchArgs)
);

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

export const fetchCurrentPlaylistMore = createAsyncThunk(
    "vk/currentPlaylistMore",
    async (playlist: types.TypeTitlePlaylist) => {
        return await fetchers.playlistMore(playlist)
    }
);

export const fetchMyTracksMore = createAsyncThunk(
    "vk/myTracksMore",
    async (playlist: types.TypeTitlePlaylist) => {
        return await fetchers.playlistMore(playlist)
    }
);

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
