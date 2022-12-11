import { Group, Header } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchCatalogTracks } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
import { EmptyResult, Loading } from "../base/blocks";
import { TrackList } from "../base/TrackList";

export const CustomPlaylistPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, data, playlist } = useTypedSelector(state => state.catalog);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === ContentTab.CUSTOM_PLAYLIST && playlist) {
            if (typeof playlist.blockId === "string") {
                const promise = dispatch(
                    fetchCatalogTracks({
                        sectionId: playlist.blockId,
                        startFrom: playlist.nextOffset
                    }));

                return () => promise.abort();
            }
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
