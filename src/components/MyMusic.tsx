import '@vkontakte/vkui/dist/vkui.css';

import { Icon56MusicOutline } from '@vkontakte/icons';
import { Group, Header, Link, Panel, PanelSpinner, Placeholder } from '@vkontakte/vkui';
import React, { FC } from 'react';

import { useTypedSelector } from '../hooks/useTypedSelector';
import { HorizantalTracks } from './HorizantalTracksList';
import { SearchTracks } from './SearchTracks';


export const MyMusic: FC = () => {
    const { loading, tracks } = useTypedSelector(state => state.playlist);

    return (
        <React.Fragment>
            <SearchTracks />
            {loading
                ? <Loading />
                : tracks.length
                    ? <Group
                        mode="plain"
                        header={<Header mode="secondary" aside={<Link>Показать все</Link>}>Недавно прослушанные</Header>}>
                        <HorizantalTracks tracks={tracks} groupElementCount={3} groupLimit={6} />
                    </Group>
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