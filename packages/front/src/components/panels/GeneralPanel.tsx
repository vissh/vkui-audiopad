import "@vkontakte/vkui/dist/vkui.css";

import { types } from "@vk-audiopad/common";
import { Group, Header } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchGeneral } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { BaseOnYourTastesCards } from "../base/BaseOnYourTastesCards";
import { Content } from "../base/Content";
import { HorizantalTitleTracks } from "../base/HorizontalTitleTracks";

export const GeneralPanel: FC = () => {
    const { userId, selectedTab } = useTypedSelector(state => state.application);
    const { error, loading, loaded, fetchResult } = useTypedSelector(state => state.general);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab.tab === types.ContentTab.GENERAL && !loaded) {
            dispatch(fetchGeneral(userId));
        }
    }, [selectedTab, loaded, userId]);

    return (
        <Content loading={loading} error={error}>
            {fetchResult && ((fetchResult.playlist && fetchResult.playlist.tracks.length > 0) || fetchResult.baseOnYourTastes.length > 0) &&
                <React.Fragment>
                    {fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                        <HorizantalTitleTracks playlist={fetchResult.playlist} />
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
            }
        </Content >
    );
};
