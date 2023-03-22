import "@vkontakte/vkui/dist/vkui.css";

import { types } from "@vk-audiopad/common";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchMyAudios, fetchMyTracksMore } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { Content } from "../base/Content";
import { HorizontalTitleCoverPlaylists } from "../base/HorizontalTitleCoverPlaylists";
import { HorizantalTitleTracks } from "../base/HorizontalTitleTracks";
import { PaginationPlaylist } from "../base/PaginationPlaylist";

export const MyMusicPanel: FC = () => {
    const { userId, selectedTab } = useTypedSelector(state => state.application);
    const { error, loading, loaded, fetchResult } = useTypedSelector(state => state.myMusic);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab.tab === types.ContentTab.MY_MUSIC && !loaded) {
            dispatch(fetchMyAudios(userId));
        }
    }, [selectedTab, userId, loaded]);

    const showContent = (
        fetchResult
        && ((fetchResult.recentTracksPlaylist && fetchResult.recentTracksPlaylist.tracks.length > 0)
            || fetchResult.coverPlaylists.length > 0
            || (fetchResult.playlist && fetchResult.playlist.tracks.length > 0))
    );

    return (
        <Content loading={loading} error={error}>
            {showContent &&
                <React.Fragment>
                    {fetchResult.recentTracksPlaylist && fetchResult.recentTracksPlaylist.tracks.length > 0 && (
                        <HorizantalTitleTracks playlist={fetchResult.recentTracksPlaylist} />
                    )}

                    {fetchResult.coverPlaylists.length > 0 && (
                        <HorizontalTitleCoverPlaylists title={"Плейлисты"} playlists={fetchResult.coverPlaylists} showMore={true} />
                    )}

                    {fetchResult.playlist?.tracks && fetchResult.playlist?.tracks.length > 0 && (
                        <PaginationPlaylist
                            loading={loading}
                            error={error}
                            playlist={fetchResult.playlist}
                            paginationFetcher={fetchMyTracksMore}
                        />
                    )}
                </React.Fragment>
            }
        </Content>
    );
};
