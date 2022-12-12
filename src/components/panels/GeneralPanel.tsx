import "@vkontakte/vkui/dist/vkui.css";

import { Group, Header, Link } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useBlockPlaylistActions, useTabActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchGeneral } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
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

                    </React.Fragment>
                    : <EmptyResult />}

        </React.Fragment>
    );
};
