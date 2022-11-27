import "@vkontakte/vkui/dist/vkui.css";

import { Icon56MusicOutline } from "@vkontakte/icons";
import { Group, Header, Link, Panel, PanelSpinner, Placeholder } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchMyAudios } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
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
                : recentTracks.length || myTracks.length
                    ? <React.Fragment>
                        {recentTracks.length && (
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
                        )}

                        {myPlaylists.length && (
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
                        )}

                        {myTracks.length && (
                            <Group
                                mode="plain"
                                header={<Header mode="secondary">Треки</Header>}
                            >
                                <TrackList tracks={myTracks} cutText={false} />
                            </Group>
                        )}

                    </React.Fragment>
                    : <EmptyResult />}

        </React.Fragment>
    );
};


const Loading: FC = () => {
    return (
        <Panel>
            <PanelSpinner />
            {/* TODO: Когда-нибудь, но не сейчас. */}
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
        </Panel>
    );
};


const EmptyResult: FC = () => {
    return (
        <Placeholder icon={<Icon56MusicOutline />}>
            По запросу не найдено ни одной аудиозаписи
            {/* TODO: Когда-нибудь, но не сейчас. */}
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
        </Placeholder>
    );
};
