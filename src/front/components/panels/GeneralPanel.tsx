import "@vkontakte/vkui/dist/vkui.css";

import { Card, CardScroll, Group, Header, Link, Text, Title } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { ContentTab } from "../../../types";
import { useBlockPlaylistActions, useTabActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchGeneral } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { EmptyResult, Loading } from "../base/blocks";
import { HorizantalTracks } from "../base/HorizantalTracksList";


export const GeneralPanel: FC = () => {
    const { setTab } = useTabActions();
    const { setBlockId } = useBlockPlaylistActions();
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, loaded, data } = useTypedSelector(state => state.general);

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
                : (data)
                    ? <React.Fragment>
                        {data.playlist && data.playlist.tracks.length > 0 && (
                            <Group
                                mode="plain"
                                header={
                                    <Header
                                        mode="secondary"
                                        aside={data.playlist.tracks.length > 6 && (
                                            <Link
                                                onClick={() => {
                                                    if (data.playlist) {
                                                        setBlockId(data.playlist.blockId);
                                                        setTab(ContentTab.BLOCK_PLAYLIST);
                                                    }
                                                }}
                                            >
                                                Показать все
                                            </Link>)}
                                    >
                                        Мои треки
                                    </Header>
                                }
                                hidden={!data.playlist.tracks.length}
                            >
                                <HorizantalTracks tracks={data.playlist.tracks} groupElementCount={3} groupLimit={6} />
                            </Group>
                        )}

                        {data.baseOnYourTastes && data.baseOnYourTastes.length > 0 && (
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
                                        {data.baseOnYourTastes.map(el => (
                                            <Card style={{
                                                backgroundImage: "url(" + el.coverUrl + ")",
                                                backgroundSize: "165px 200px",
                                                // 198x240
                                                width: "165px",
                                                height: "200px"
                                            }} >
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
                                                    {el.title}
                                                </Title>
                                                <Text
                                                    style={{
                                                        marginBottom: 48,
                                                        textAlign: "center",
                                                        color: "white",
                                                    }}
                                                >
                                                    {el.authorLine}
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
