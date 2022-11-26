import { bindActionCreators } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

import { myMusicSlice, searchSlice } from "../store/slice";

export const useMyMusicActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(myMusicSlice.actions, dispatch);
}


export const useSearchActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(searchSlice.actions, dispatch);
}
