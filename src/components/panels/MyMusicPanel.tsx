import "@vkontakte/vkui/dist/vkui.css";

import { Group, Header, Link } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchMyAudios } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
import { EmptyResult, Loading } from "../base/blocks";
import { HorizantalTracks } from "../base/HorizantalTracksList";
import { HorizantalPlaylists } from "../base/HorizontalPlaylists";
import { TrackList } from "../base/TrackList";


export const MyMusicPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, loaded, myTracks, recentTracks, myPlaylists } = useTypedSelector(state => state.myMusic);

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
                : (recentTracks.length || myTracks.length)
                    ? <React.Fragment>
                        {recentTracks.length ? (
                            <Group
                                mode="plain"
                                header={
                                    <Header
                                        mode="secondary"
                                        aside={recentTracks.length > 6 && <Link>Показать все</Link>}
                                    >
                                        Недавно прослушанные
                                    </Header>
                                }
                            >
                                <HorizantalTracks tracks={recentTracks} groupElementCount={3} groupLimit={6} />
                            </Group>
                        ) : ""}

                        {myPlaylists.length ? (
                            <Group
                                mode="plain"
                                separator="hide"
                                header={
                                    <Header
                                        mode="secondary"
                                        aside={myPlaylists.length > 6 && <Link>Показать все</Link>}
                                    >
                                        Плейлисты
                                    </Header>
                                }
                            >
                                <HorizantalPlaylists playlists={myPlaylists} />
                            </Group>
                        ) : ""}

                        {myTracks.length ? (
                            <Group
                                mode="plain"
                                header={<Header mode="secondary">Треки</Header>}
                            >
                                <TrackList tracks={myTracks} />
                            </Group>
                        ) : ""}

                    </React.Fragment>
                    : <EmptyResult />}

        </React.Fragment>
    );
};
