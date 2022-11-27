import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ContentTab } from "../types";
import { TypeTabState } from "./types";


const initialTabState: TypeTabState = {
    activeTab: ContentTab.MY_MUSIC
}

export const tabSlice = createSlice({
    name: "tab",
    initialState: initialTabState,
    reducers: {
        setTab: (state, tab: PayloadAction<ContentTab>) => {
            state.activeTab = tab.payload;
        },
    }

});
