import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ContentTab, GeneralFetchData, MyMusicFetchData, SearchFetchData } from "../types";
import { fetchGeneralSection, fetchMyMusicSection, fetchSearchTracksSection } from "../vkcom/client";
import { initialGeneralState, initialMyMusicState, initialSearchTracksState, initialTabState } from "./initialState";

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

export const fetchSearchTracks = createAsyncThunk(
    "vk/searchTracks",
    async (value: string) => await fetchSearchTracksSection(value)
);
