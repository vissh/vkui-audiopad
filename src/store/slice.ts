import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ContentTab, ExploreFetchData, GeneralFetchData, MyMusicFetchData, SearchFetchData } from "../types";
import { fetchExploreSection } from "../vkcom/fetchers/explore";
import { fetchGeneralSection } from "../vkcom/fetchers/general";
import { fetchMyMusicSection } from "../vkcom/fetchers/myMusic";
import { fetchSearchTracksSection } from "../vkcom/fetchers/search";
import { initialExploreState, initialGeneralState, initialMyMusicState, initialSearchTracksState, initialTabState } from "./initialState";

export const tabSlice = createSlice({
    name: "tab",
    initialState: initialTabState,
    reducers: {
        setTab: (state, tab: PayloadAction<ContentTab>) => {
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
            .addCase(fetchGeneral.fulfilled, (state, action: PayloadAction<GeneralFetchData>) => {
                state.myTracks = action.payload.myTracks;
                state.baseOnYourTastes = action.payload.baseOnYourTastes;
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
            .addCase(fetchMyAudios.fulfilled, (state, action: PayloadAction<MyMusicFetchData>) => {
                state.myTracks = action.payload.myTracks;
                state.recentTracks = action.payload.recentTracks;
                state.myPlaylists = action.payload.myPlaylists;
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
            .addCase(fetchExplore.fulfilled, (state, action: PayloadAction<ExploreFetchData>) => {
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
            .addCase(fetchSearchTracks.fulfilled, (state, action: PayloadAction<SearchFetchData>) => {
                state.tracks = action.payload.tracks;
                state.loading = false;
                state.loaded = true;
            });
    },
});

export const fetchMyAudios = createAsyncThunk(
    "vk/fetchMyAudios",
    async () => await fetchMyMusicSection()
);

export const fetchGeneral = createAsyncThunk(
    "vk/fetchGeneral",
    async () => await fetchGeneralSection()
);

export const fetchExplore = createAsyncThunk(
    "vk/explore",
    async () => await fetchExploreSection()
)

export const fetchSearchTracks = createAsyncThunk(
    "vk/searchTracks",
    async (value: string) => await fetchSearchTracksSection(value)
);
