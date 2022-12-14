import { Group, Header, Link } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";

import React, { FC, useEffect } from "react";

import { ContentTab } from "../../../types";
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
    const { loading, loaded, data } = useTypedSelector(state => state.myMusic);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === ContentTab.MY_MUSIC && !loaded) {
            const promise = dispatch(fetchMyAudios());
            return () => promise.abort();
        }

        // eslint-disable-next-line
    }, [selectedTab]);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : (data)
                    ? <React.Fragment>
                        {data.recentTracksPlaylist && data.recentTracksPlaylist.tracks.length > 0 && (
                            <Group
                                mode="plain"
                                header={<ShowAllTracksHeaderLink playlist={data.recentTracksPlaylist} />}
                            >
                                <HorizantalTracks
                                    tracks={data.recentTracksPlaylist.tracks}
                                    groupElementCount={3}
                                    groupLimit={6}
                                />
                            </Group>
                        )}

                        {data.coverPlaylists.length > 0 && (
                            <Group
                                mode="plain"
                                separator="hide"
                                header={
                                    <Header
                                        mode="secondary"
                                        aside={data.coverPlaylists.length > 6 && <Link>Показать все</Link>}
                                    >
                                        Плейлисты
                                    </Header>
                                }
                            >
                                <HorizantalPlaylists playlists={data.coverPlaylists} />
                            </Group>
                        )}

                        {data.playlist?.tracks && data.playlist.tracks.length > 0 && (
                            <Group
                                mode="plain"
                                header={<Header mode="secondary">Треки</Header>}
                            >
                                <TrackList tracks={data.playlist.tracks} />
                            </Group>
                        )}
                    </React.Fragment>
                    : <EmptyResult />
            }
        </React.Fragment>
    );
};
