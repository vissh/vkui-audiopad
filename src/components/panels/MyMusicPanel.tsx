import "@vkontakte/vkui/dist/vkui.css";

import { Icon56MusicOutline } from "@vkontakte/icons";
import { Group, Header, Link, Panel, PanelSpinner, Placeholder } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";
import { from, tap } from "rxjs";

import { useMyMusicActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { ITrackItem } from "../../types";
import { fetchMyMusic } from "../../vkcom/client";
import { HorizantalTracks } from "../base/HorizantalTracksList";
import { TrackList } from "../base/TrackList";


export const MyMusicPanel: FC = () => {
    const { loading, recentlyPlayed, myTracks } = useTypedSelector(state => state.mymusic);
    const { setLoading, setLoaded, setRecentlyPlayed, setMyTracks } = useMyMusicActions();

    useEffect(() => {

        setLoading();
        from((async () => await fetchMyMusic())())
            .pipe(tap(setLoaded))
            .subscribe(value => {
                const [recentAudios, myAudios] = ((value as unknown) as ITrackItem[][]);
                setRecentlyPlayed(recentAudios);
                setMyTracks(myAudios);
            });

        // eslint-disable-next-line
    }, []);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : recentlyPlayed.length || myTracks.length
                    ? <React.Fragment>

                        <Group
                            mode="plain"
                            header={<Header mode="secondary" aside={<Link>Показать все</Link>}>Недавно прослушанные</Header>}
                            hidden={!recentlyPlayed.length}
                        >
                            <HorizantalTracks tracks={recentlyPlayed} groupElementCount={3} groupLimit={6} />
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
