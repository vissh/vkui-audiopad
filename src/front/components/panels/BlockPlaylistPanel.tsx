import { Group, Header } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { ContentTab } from "../../../types";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchBlockPlaylist } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { EmptyResult, Loading } from "../base/blocks";
import { TrackList } from "../base/TrackList";

export const BlockPlaylistPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, data, blockId } = useTypedSelector(state => state.blockPlaylist);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === ContentTab.BLOCK_PLAYLIST) {
            const promise = dispatch(fetchBlockPlaylist(blockId));
            return () => promise.abort();
        }

        // eslint-disable-next-line
    }, [selectedTab]);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : <React.Fragment>
                    {data && data.tracks.length > 0
                        ? (
                            <Group
                                mode="plain"
                                header={
                                    <Header mode="secondary">
                                        {data.title}
                                    </Header>
                                }
                            >
                                <TrackList tracks={data.tracks} />
                            </Group>
                        ) : <EmptyResult />
                    }
                </React.Fragment>
            }
        </React.Fragment>
    );
};
