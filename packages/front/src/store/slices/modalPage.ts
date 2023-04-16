import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialModalPageState } from "../initialState";
import { EModalPage } from "../types";

export const modalPageSlice = createSlice({
    name: "modalPage",
    initialState: initialModalPageState,
    reducers: {
        setActiveModal: (state, value: PayloadAction<EModalPage | null>) => {
            state.activeModal = value.payload;
        },
    },
});
