import "@vkontakte/vkui/dist/vkui.css";

import { Group, Header } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { ContentTab } from "../../../types";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchGeneral } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { BaseOnYourTastesCards } from "../base/BaseOnYourTastesCards";
import { EmptyResult, Loading } from "../base/blocks";
import { HorizantalTracks } from "../base/HorizantalTracksList";
import { ShowAllTracksHeaderLink } from "../base/ShowAllTracksHeaderLink";


export const GeneralPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, loaded, fetchResult } = useTypedSelector(state => state.general);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === ContentTab.GENERAL && !loaded) {
            const promise = dispatch(fetchGeneral());
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
                        {fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                            <Group
                                mode="plain"
                                header={<ShowAllTracksHeaderLink playlist={fetchResult.playlist} />}
                                hidden={!fetchResult.playlist.tracks.length}
                            >
                                <HorizantalTracks tracks={fetchResult.playlist.tracks} groupElementCount={3} groupLimit={6} />
                            </Group>
                        )}

                        {fetchResult.baseOnYourTastes && fetchResult.baseOnYourTastes.length > 0 && (
                            <Group
                                mode="plain"
                                header={
                                    <Header mode="secondary">
                                        Собрано алгоритмами
                                    </Header>
                                }
                            >
                                <BaseOnYourTastesCards coverPlaylists={fetchResult.baseOnYourTastes} />
                            </Group>
                        )}

                    </React.Fragment>
                    : <EmptyResult />}
        </React.Fragment >
    );
};
