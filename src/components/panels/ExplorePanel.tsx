import "@vkontakte/vkui/dist/vkui.css";

import { Group, Header, Link } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchExplore } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
import { EmptyResult, Loading } from "../base/blocks";
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
