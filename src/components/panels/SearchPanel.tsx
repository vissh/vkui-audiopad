import { Icon56MusicOutline } from "@vkontakte/icons";
import { Panel, PanelSpinner, Placeholder } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useSearchTracksActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchSearchTracks } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
import { TrackList } from "../base/TrackList";

export const SearchPanel: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const { loading, searchValue, tracks } = useTypedSelector(state => state.search);
    const { resetState } = useSearchTracksActions();

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (selectedTab === ContentTab.SEARCH && searchValue) {
            const promise = dispatch(fetchSearchTracks(searchValue));
            return () => promise.abort();
        }

        // eslint-disable-next-line
    }, [searchValue]);

    useEffect(() => {
        return () => { resetState() };

        // eslint-disable-next-line
    }, []);

    return (
        <React.Fragment>
            {loading
                ? <Loading />
                : <React.Fragment>
                    {tracks.length
                        ? (<TrackList tracks={tracks} />)
                        : <EmptyResult />
                    }
                </React.Fragment>
            }
        </React.Fragment>
    );
};

const Loading: FC = () => {
    return (
        <Panel>
            <PanelSpinner />
            {/* TODO: Когда-нибудь, но не сейчас. */}
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
        </Panel>
    );
};


const EmptyResult: FC = () => {
    return (
        <Placeholder icon={<Icon56MusicOutline />}>
            По запросу не найдено ни одной аудиозаписи
            {/* TODO: Когда-нибудь, но не сейчас. */}
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
        </Placeholder>
    );
};
