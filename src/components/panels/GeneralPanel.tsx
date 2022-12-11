import "@vkontakte/vkui/dist/vkui.css";

import { Group, Header, Link } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchGeneral } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
import { EmptyResult, Loading } from "../base/blocks";
import { HorizantalTracks } from "../base/HorizantalTracksList";


export const GeneralPanel: FC = () => {
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
                        {data.myTracks.length > 0 && (
                            <Group
                                mode="plain"
                                header={
                                    <Header
                                        mode="secondary"
                                        aside={<Link>Показать все</Link>}
                                    >
                                        Мои треки
                                    </Header>
                                }
                                hidden={!data.myTracks.length}
                            >
                                <HorizantalTracks tracks={data.myTracks} groupElementCount={3} groupLimit={6} />
                            </Group>
                        )}

                    </React.Fragment>
                    : <EmptyResult />}

        </React.Fragment>
    );
};
