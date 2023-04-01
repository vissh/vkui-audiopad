import { types } from "@vk-audiopad/common";
import { FC, useEffect } from "react";
import { useBlockPlaylistActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchPlaylist, fetchPlaylistMore } from "../../store/slices/blockPlaylist";
import { useAppDispatch } from "../../store/store";
import { PaginationPlaylist } from "../base/PaginationPlaylist";

export const BlockPlaylistPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.application);
    const { error, loading, fetchResult } = useTypedSelector(state => state.blockPlaylist);

    const { resetState } = useBlockPlaylistActions();

    const dispatch = useAppDispatch();

    useEffect(() => {
        return () => { resetState() };
    }, []);

    useEffect(() => {
        if (selectedTab.tab === types.ContentTab.BLOCK_PLAYLIST) {
            dispatch(fetchPlaylist({
                fromId: selectedTab.fromId,
                playlist: selectedTab.playlist,
            }));
        }
    }, [selectedTab]);

    return (
        <PaginationPlaylist
            loading={loading}
            error={error}
            playlist={fetchResult?.playlist || null}
            paginationFetcher={fetchPlaylistMore} />
    );
};
