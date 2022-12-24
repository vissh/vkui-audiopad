import "@vkontakte/vkui/dist/vkui.css";

import { types } from "@vk-audiopad/common";
import { Group } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchExplore } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { EmptyResult, Loading } from "../base/blocks";
import { HorizantalTracks } from "../base/HorizantalTracksList";
import { ShowAllTracksHeaderLink } from "../base/ShowAllTracksHeaderLink";


export const ExplorePanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, loaded, playlists } = useTypedSelector(state => state.explore);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === types.ContentTab.EXPLORE && !loaded) {
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
                                    header={<ShowAllTracksHeaderLink playlist={playlist} />}
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
