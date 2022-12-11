import "@vkontakte/vkui/dist/vkui.css";

import { Icon56MusicOutline } from "@vkontakte/icons";
import { Group, Header, Link, Panel, PanelSpinner, Placeholder } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchExplore } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
import { HorizantalTracks } from "../base/HorizantalTracksList";


export const ExplorePanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, loaded, playlists } = useTypedSelector(state => state.explore);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === ContentTab.EXPLORE && !loaded) {
            const promise = dispatch(fetchExplore());
            return () => promise.abort();
        }

        // eslint-disable-next-line
    }, [selectedTab]);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : playlists.length
                    ? <React.Fragment>
                        {playlists.map((playlist) => {
                            return (
                                <Group
                                    mode="plain"
                                    header={
                                        <Header
                                            mode="secondary"
                                            aside={playlist.tracks.length > 6 && <Link>Показать все</Link>}
                                        >
                                            {playlist.title}
                                        </Header>
                                    }
                                >
                                    <HorizantalTracks tracks={playlist.tracks} groupElementCount={3} groupLimit={6} />
                                </Group>
                            )
                        })}

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
