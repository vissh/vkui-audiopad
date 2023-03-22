import "@vkontakte/vkui/dist/vkui.css";

import { types } from "@vk-audiopad/common";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchExplore, fetchExploreMore } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { Content } from "../base/Content";
import { HorizantalTitleTracks } from "../base/HorizontalTitleTracks";

export const ExplorePanel: FC = () => {
    const { userId, selectedTab } = useTypedSelector(state => state.application);
    const { error, loading, loaded, fetchResult } = useTypedSelector(state => state.explore);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab.tab === types.ContentTab.EXPLORE && !loaded) {
            dispatch(fetchExplore(userId));
        }
    }, [selectedTab, loaded, userId]);

    useEffect(() => {
        if (!loading && fetchResult?.nextFrom) {
            dispatch(fetchExploreMore(fetchResult));
        }
    }, [fetchResult, loading]);

    return (
        <Content loading={loading} hideLoader={loaded} error={error} >
            {fetchResult && fetchResult.playlists.length > 0 &&
                <React.Fragment>
                    {fetchResult.playlists.map((playlist) => <HorizantalTitleTracks playlist={playlist} />)}
                </React.Fragment>
            }
        </Content>
    );
};
