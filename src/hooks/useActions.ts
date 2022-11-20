import { useDispatch } from 'react-redux';

import { bindActionCreators } from '@reduxjs/toolkit';

import { playlistSlice } from '../store/slice';

export const useCurrentPlaylistActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(playlistSlice.actions, dispatch);
}
