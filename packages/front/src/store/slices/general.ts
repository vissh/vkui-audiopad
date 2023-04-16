import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchers, types } from "@vk-audiopad/common";
import { initialGeneralState } from "../initialState";

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

export const fetchGeneral = createAsyncThunk(
    "vk/fetchGeneral",
    async (ownerId: string) => await fetchers.general(ownerId)
);
