import React, { FC, useEffect } from "react";

import { useSearchTracksActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchSearchTracks } from "../../store/slice";
import { useAppDispatch } from "../../store/store";
import { ContentTab } from "../../types";
import { EmptyResult, Loading } from "../base/blocks";
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
