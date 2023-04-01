import { bindActionCreators } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { applicationSlice } from "../store/slices/application";
import { blockPlaylist } from "../store/slices/blockPlaylist";
import { coverPlaylists } from "../store/slices/coverPlaylist";
import { searchTracks } from "../store/slices/search";

export const useApllicationActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(applicationSlice.actions, dispatch);
};

export const useSearchTracksActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(searchTracks.actions, dispatch);
};

export const useBlockPlaylistActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(blockPlaylist.actions, dispatch);
};

export const userCoverPlaylistsActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(coverPlaylists.actions, dispatch);
};
