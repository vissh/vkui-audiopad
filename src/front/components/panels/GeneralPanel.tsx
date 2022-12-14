import "@vkontakte/vkui/dist/vkui.css";

import { Card, CardScroll, Group, Header, Text, Title } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { ContentTab } from "../../../types";
import { useBlockPlaylistActions, useTabActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchGeneral } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { EmptyResult, Loading } from "../base/blocks";
import { HorizantalTracks } from "../base/HorizantalTracksList";
import { ShowAllTracksHeaderLink } from "../base/ShowAllTracksHeaderLink";


export const GeneralPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, loaded, fetchResult } = useTypedSelector(state => state.general);
    const { setTab } = useTabActions();
    const { setBlockId } = useBlockPlaylistActions();

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
                                    <Header
                                        mode="secondary"
                                    >
                                        Собрано алгоритмами
                                    </Header>
                                }
                            >
                                <CardScroll size="s">
                                    <div style={{ display: "flex" }}>
                                        {fetchResult.baseOnYourTastes.map(coverPlaylist => (
                                            <Card
                                                style={{
                                                    backgroundImage: "url(" + coverPlaylist.coverUrl + ")",
                                                    backgroundSize: "165px 200px",
                                                    width: "165px",
                                                    height: "200px",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => {
                                                    setBlockId(coverPlaylist);
                                                    setTab(ContentTab.BLOCK_PLAYLIST);
                                                }}
                                            >
                                                <Title
                                                    style={{
                                                        marginBottom: 12,
                                                        marginTop: 20,
                                                        textAlign: "center",
                                                        color: "white",
                                                    }}
                                                    level="1"
                                                    weight="1"
                                                >
                                                    {coverPlaylist.title}
                                                </Title>
                                                <Text
                                                    style={{
                                                        marginBottom: 48,
                                                        textAlign: "center",
                                                        color: "white",
                                                    }}
                                                >
                                                    {coverPlaylist.authorLine}
                                                </Text>
                                            </Card>
                                        ))}
                                    </div>
                                </CardScroll>
                            </Group>
                        )}

                    </React.Fragment>
                    : <EmptyResult />}
        </React.Fragment >
    );
};
