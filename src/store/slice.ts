import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ContentTab, GeneralFetchData, MyMusicFetchData } from "../types";
import { fetchGeneralSection, fetchMyMusicSection } from "../vkcom/client";
import { initialGeneralState, initialMyMusicState, initialTabState } from "./initialState";

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
                state.loading = false;
                state.loaded = true;
            });
    },
});

export const fetchMyAudios = createAsyncThunk(
    'vk/fetchMyAudios',
    async () => await fetchMyMusicSection()
);

export const fetchGeneral = createAsyncThunk(
    'vk/fetchGeneral',
    async () => await fetchGeneralSection()
);
