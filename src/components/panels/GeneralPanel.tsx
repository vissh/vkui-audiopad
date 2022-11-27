import "@vkontakte/vkui/dist/vkui.css";

import { Icon56MusicOutline } from "@vkontakte/icons";
import { Group, Header, Link, Panel, PanelSpinner, Placeholder } from "@vkontakte/vkui";
import React, { FC, useEffect, useState } from "react";
import { from, tap } from "rxjs";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { ContentTab, GeneralFetchData, ITrackItem } from "../../types";
import { fetchGeneralSection } from "../../vkcom/client";
import { HorizantalTracks } from "../base/HorizantalTracksList";


export const GeneralPanel: FC = () => {
    const { activeTab } = useTypedSelector(state => state.activetab);

    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const [myTracks, setMyTracks] = useState<ITrackItem[]>([]);

    useEffect(() => {
        if (activeTab === ContentTab.GENERAL && !loaded) {
            setLoading(true);
            from((async () => await fetchGeneralSection())())
                .pipe(tap(() => setLoading(false)))
                .subscribe(value => {
                    const data = ((value as unknown) as GeneralFetchData);
                    setMyTracks(data.myAudios);
                    setLoaded(true);
                });
        }

        // eslint-disable-next-line
    }, [activeTab]);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : myTracks.length
                    ? <React.Fragment>

                        <Group
                            mode="plain"
                            header={<Header mode="secondary" aside={<Link>Показать все</Link>}>Мои треки</Header>}
                            hidden={!myTracks.length}
                        >
                            <HorizantalTracks tracks={myTracks} groupElementCount={3} groupLimit={6} />
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
