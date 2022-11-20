import '@vkontakte/vkui/dist/vkui.css';

import { Icon56MusicOutline } from '@vkontakte/icons';
import { Group, Header, Link, List, Panel, PanelSpinner, Placeholder } from '@vkontakte/vkui';
import React, { FC, useEffect } from 'react';

import { from, switchMap, tap } from 'rxjs';
import { useMyMusicActions } from '../hooks/useActions';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { ITrackItem } from '../types';
import { fetchMyMusic } from '../vkcom/client';
import { HorizantalTracks } from './HorizantalTracksList';
import { SearchTracks } from './SearchTracks';
import { Track } from './Track';


export const MyMusic: FC = () => {
    const { loading, recentlyPlayed, myTracks } = useTypedSelector(state => state.mymusic);
    const { setLoading, setLoaded, setRecentlyPlayed, setMyTracks } = useMyMusicActions();

    useEffect(() => {
        const fetchFn = async () => {
            return await fetchMyMusic();
        };

        from([1])
            .pipe(
                tap(setLoading),
                switchMap(() => from(fetchFn())),
                tap(setLoaded),
            )
            .subscribe(value => {
                const [recentAudios, myAudios] = ((value as unknown) as ITrackItem[][]);
                setRecentlyPlayed(recentAudios);
                setMyTracks(myAudios);
            });

    }, []);

    return (
        <React.Fragment>
            <SearchTracks />
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
                            <List>
                                {myTracks.map(track => <Track track={track} />)}
                            </List>
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
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
        </Placeholder>
    );
};