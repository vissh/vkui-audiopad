import "@vkontakte/vkui/dist/vkui.css";

import { Icon56MusicOutline } from "@vkontakte/icons";
import { Group, Header, Link, Panel, PanelSpinner, Placeholder } from "@vkontakte/vkui";
import React, { FC, useEffect, useState } from "react";
import { from, tap } from "rxjs";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { ContentTab, ITrackItem, MyMusicFetchData } from "../../types";
import { fetchMyMusicSection } from "../../vkcom/client";
import { HorizantalTracks } from "../base/HorizantalTracksList";
import { TrackList } from "../base/TrackList";


export const MyMusicPanel: FC = () => {
    const { activeTab } = useTypedSelector(state => state.activetab);

    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const [myTracks, setMyTracks] = useState<ITrackItem[]>([]);
    const [recentlyTracks, setRecentlyTracks] = useState<ITrackItem[]>([]);

    useEffect(() => {

        if (activeTab === ContentTab.MY_MUSIC && !loaded) {
            setLoading(true);
            from((async () => await fetchMyMusicSection())())
                .pipe(tap(() => setLoading(false)))
                .subscribe(value => {
                    const fetchData = ((value as unknown) as MyMusicFetchData);
                    setRecentlyTracks(fetchData.recentAudios);
                    setMyTracks(fetchData.myAudios);
                    setLoaded(true);
                });
        }

        // eslint-disable-next-line
    }, [activeTab]);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : recentlyTracks.length || myTracks.length
                    ? <React.Fragment>

                        <Group
                            mode="plain"
                            header={<Header mode="secondary" aside={<Link>Показать все</Link>}>Недавно прослушанные</Header>}
                            hidden={!recentlyTracks.length}
                        >
                            <HorizantalTracks tracks={recentlyTracks} groupElementCount={3} groupLimit={6} />
                        </Group>

                        <Group
                            mode="plain"
                            header={<Header mode="secondary">Треки</Header>}
                            hidden={!myTracks.length}
                        >
                            <TrackList tracks={myTracks} cutText={false} />
                        </Group>

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
