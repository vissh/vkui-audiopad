import { bindActionCreators } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

import { playlistSlice } from '../store/slice';

export const useCurrentPlaylistActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(playlistSlice.actions, dispatch);
}
