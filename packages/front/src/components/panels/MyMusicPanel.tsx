import { Group, Header, Link } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";

import { types } from "@vk-audiopad/common";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchMyAudios } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { EmptyResult, Loading } from "../base/blocks";
import { HorizantalTracks } from "../base/HorizantalTracksList";
import { HorizantalPlaylists } from "../base/HorizontalPlaylists";
import { ShowAllTracksHeaderLink } from "../base/ShowAllTracksHeaderLink";
import { TrackList } from "../base/TrackList";


export const MyMusicPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, loaded, fetchResult } = useTypedSelector(state => state.myMusic);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === types.ContentTab.MY_MUSIC && !loaded) {
            const promise = dispatch(fetchMyAudios());
            return () => promise.abort();
        }

        // eslint-disable-next-line
    }, [selectedTab]);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : (fetchResult)
                    ? <React.Fragment>
                        {fetchResult.recentTracksPlaylist && fetchResult.recentTracksPlaylist.tracks.length > 0 && (
                            <Group
                                mode="plain"
                                header={<ShowAllTracksHeaderLink playlist={fetchResult.recentTracksPlaylist} />}
                            >
                                <HorizantalTracks
                                    tracks={fetchResult.recentTracksPlaylist.tracks}
                                    groupElementCount={3}
                                    groupLimit={6}
                                />
                            </Group>
                        )}

                        {fetchResult.coverPlaylists.length > 0 && (
                            <Group
                                mode="plain"
                                separator="hide"
                                header={
                                    <Header
                                        mode="secondary"
                                        aside={fetchResult.coverPlaylists.length > 6 && <Link>Показать все</Link>}
                                    >
                                        Плейлисты
                                    </Header>
                                }
                            >
                                <HorizantalPlaylists playlists={fetchResult.coverPlaylists} />
                            </Group>
                        )}

                        {fetchResult.playlist?.tracks && fetchResult.playlist.tracks.length > 0 && (
                            <Group
                                mode="plain"
                                header={<Header mode="secondary">Треки</Header>}
                            >
                                <TrackList tracks={fetchResult.playlist.tracks} />
                            </Group>
                        )}
                    </React.Fragment>
                    : <EmptyResult />
            }
        </React.Fragment>
    );
};
