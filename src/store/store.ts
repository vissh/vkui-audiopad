import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { myMusicSlice, searchSlice } from './slice';

const rootReducer = combineReducers({
    mymusic: myMusicSlice.reducer,
    search: searchSlice.reducer,
});

export const store = configureStore({
    reducer: rootReducer,
});

export type TypeRootState = ReturnType<typeof rootReducer>;
