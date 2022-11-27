import { bindActionCreators } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

import { tabSlice } from "../store/slice";


export const useTabActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(tabSlice.actions, dispatch);
}
