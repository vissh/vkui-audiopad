import { types } from "@vk-audiopad/common";
import React, { FC, useEffect } from "react";

import { useSearchTracksActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchSearchTracks } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { Content } from "../base/Content";
import { HorizontalTitleCoverPlaylists } from "../base/HorizontalTitleCoverPlaylists";
import { HorizantalTitleTracks } from "../base/HorizontalTitleTracks";

export const SearchPanel: FC = () => {
    const { selectedTab, userId } = useTypedSelector(state => state.application);
    const { error, loading, fetchResult } = useTypedSelector(state => state.search);

    const { resetState } = useSearchTracksActions();

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab.tab === types.ContentTab.SEARCH && selectedTab.value) {
            dispatch(fetchSearchTracks({ ownerId: userId, value: selectedTab.value }));
        }
    }, [selectedTab, userId]);

    useEffect(() => {
        return () => { resetState() };
    }, []);

    return (
        <Content loading={loading} error={error}>
            {fetchResult && (fetchResult.trackPlaylists.length > 0 || fetchResult.officialAlbums.length > 0 || fetchResult.otherPlaylists.length > 0) &&
                <React.Fragment>
                    {fetchResult.trackPlaylists.length > 0 && (
                        fetchResult.trackPlaylists.map((playlist) => <HorizantalTitleTracks playlist={playlist} />)
                    )}

                    {fetchResult.officialAlbums.length > 0 && (
                        <HorizontalTitleCoverPlaylists title={"Альбомы"} playlists={fetchResult.officialAlbums} />
                    )}

                    {fetchResult.otherPlaylists.length > 0 && (
                        <HorizontalTitleCoverPlaylists title={"Плейлисты"} playlists={fetchResult.otherPlaylists} />
                    )}
                </React.Fragment>
            }
        </Content>
    );
};
