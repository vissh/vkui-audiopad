import { bindActionCreators } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

import { catalogTracks, searchTracks, tabSlice } from "../store/slice";


export const useTabActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(tabSlice.actions, dispatch);
};

export const useSearchTracksActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(searchTracks.actions, dispatch);
};

export const useCatalogTracksActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(catalogTracks.actions, dispatch);
};
