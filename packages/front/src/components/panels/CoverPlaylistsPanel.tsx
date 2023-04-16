import { types, utils } from "@vk-audiopad/common";
import { List } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import { FC, useEffect } from "react";
import { userCoverPlaylistsActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchCoverPlaylists, fetchCoverPlaylistsMore } from "../../store/slices/coverPlaylist";
import { useAppDispatch } from "../../store/store";
import { HorizantalCoverPlaylists } from "../base/HorizontalCoverPlaylists";
import { PaginationContent } from "../base/PaginationContent";

export const CoverPlaylistsPanel: FC = () => {
    const { userId, selectedTab } = useTypedSelector(state => state.application);
    const { error, loading, loaded, fetchResult } = useTypedSelector(state => state.coverPlaylists);

    const { resetState } = userCoverPlaylistsActions();

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab.tab === types.ContentTab.COVER_PLAYLISTS && !loaded) {
            dispatch(fetchCoverPlaylists(userId));
        }
    }, [selectedTab, userId, loaded]);

    useEffect(() => {
        return () => { resetState() };
    }, []);

    const columnsPlaylists: types.TypeCoverPlaylist[][] = fetchResult && Array.from(utils.chunked(fetchResult.coverPlaylists, 5)) || [];

    const needMore = (): string => {
        return fetchResult && fetchResult.nextFrom || "";
    };

    const paginationFetcher = () => {
        if (fetchResult) {
            return fetchCoverPlaylistsMore({
                sectionId: fetchResult.sectionId,
                nextFrom: fetchResult.nextFrom,
            });
        }
    };

    return (
        <PaginationContent loading={loading} error={error} paginationFetcher={paginationFetcher} needMore={needMore}>
            <List>
                {columnsPlaylists.map(playlists => (
                    <HorizantalCoverPlaylists playlists={playlists} />
                ))}
            </List>
        </PaginationContent>
    );
};
