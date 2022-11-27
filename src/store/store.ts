import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { tabSlice } from "./slice";

const rootReducer = combineReducers({
    activetab: tabSlice.reducer,
});

export const store = configureStore({
    reducer: rootReducer,
});

export type TypeRootState = ReturnType<typeof rootReducer>;
