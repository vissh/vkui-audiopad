import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, types } from "@vk-audiopad/common";

import { initialBlockPlaylistState, initialExploreState, initialGeneralState, initialMyMusicState, initialSearchTracksState, initialTabState } from "./initialState";

export const tabSlice = createSlice({
    name: "tab",
    initialState: initialTabState,
    reducers: {
        setTab: (state, tab: PayloadAction<types.ContentTab>) => {
            state.selectedTab = tab.payload;
        },
    }
});

export const generalSlice = createSlice({
    name: "general",
    initialState: initialGeneralState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchGeneral.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGeneral.fulfilled, (state, action: PayloadAction<types.IGeneralFetchData>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
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
            })
            .addCase(fetchMyAudios.fulfilled, (state, action: PayloadAction<types.IMyMusicFetchData>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
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
            })
            .addCase(fetchExplore.fulfilled, (state, action: PayloadAction<types.IExploreFetchData>) => {
                state.playlists = action.payload.playlists;
                state.loading = false;
                state.loaded = true;
            })
    },
});

export const searchTracks = createSlice({
    name: "searchTracks",
    initialState: initialSearchTracksState,
    reducers: {
        setSearchValue: (state, value: PayloadAction<string>) => {
            state.searchValue = value.payload;
        },
        resetState: (state) => {
            Object.assign(state, initialSearchTracksState);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSearchTracks.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSearchTracks.fulfilled, (state, action: PayloadAction<types.ISearchFetchData>) => {
                state.tracks = action.payload.tracks;
                state.loading = false;
                state.loaded = true;
            });
    },
});

export const blockPlaylist = createSlice({
    name: "blockPlaylist",
    initialState: initialBlockPlaylistState,
    reducers: {
        setBlockId: (state, value: PayloadAction<types.ITitlePlaylist>) => {
            state.playlist = value.payload;
        },
        resetState: (state) => {
            Object.assign(state, initialBlockPlaylistState);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPlaylist.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchPlaylist.fulfilled, (state, action: PayloadAction<types.ITitlePlaylist>) => {
                state.fetchResult = action.payload;
                state.loading = false;
                state.loaded = true;
            });
    },
})

export const fetchMyAudios = createAsyncThunk(
    "vk/fetchMyAudios",
    async () => await fetchers.myMusic()
);

export const fetchGeneral = createAsyncThunk(
    "vk/fetchGeneral",
    async () => await fetchers.general()
);

export const fetchExplore = createAsyncThunk(
    "vk/explore",
    async () => await fetchers.explore()
)

export const fetchSearchTracks = createAsyncThunk(
    "vk/searchTracks",
    async (value: string) => await fetchers.searchTracks(value)
);

export const fetchPlaylist = createAsyncThunk(
    "vk/Playlist",
    async (playlist: types.ITitlePlaylist) => await fetchers.playlist(playlist)
);
