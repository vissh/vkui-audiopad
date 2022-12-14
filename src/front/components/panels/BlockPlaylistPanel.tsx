import { Group, Header } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { ContentTab } from "../../../types";
import { useBlockPlaylistActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchPlaylist } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { EmptyResult, Loading } from "../base/blocks";
import { TrackList } from "../base/TrackList";

export const BlockPlaylistPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, playlist, fetchResult } = useTypedSelector(state => state.blockPlaylist);
    const { resetState } = useBlockPlaylistActions();

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === ContentTab.BLOCK_PLAYLIST && playlist) {
            const promise = dispatch(fetchPlaylist(playlist));
            return () => promise.abort();
        }

        // eslint-disable-next-line
    }, [selectedTab]);

    useEffect(() => {
        return () => { resetState() };

        // eslint-disable-next-line
    }, []);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : <React.Fragment>
                    {fetchResult && fetchResult.tracks.length > 0
                        ? (
                            <Group
                                mode="plain"
                                header={
                                    <Header mode="secondary">
                                        {fetchResult.title}
                                    </Header>
                                }
                            >
                                <TrackList tracks={fetchResult.tracks} />
                            </Group>
                        ) : <EmptyResult />
                    }
                </React.Fragment>
            }
        </React.Fragment>
    );
};
