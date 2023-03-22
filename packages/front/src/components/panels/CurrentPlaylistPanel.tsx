import { FC } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { fetchCurrentPlaylistMore } from "../../store/slice";
import { PaginationPlaylist } from "../base/PaginationPlaylist";

export const CurrentPlaylistPanel: FC = () => {
    const { loading, error, currentPlaylist } = useTypedSelector(state => state.application);

    return (
        <PaginationPlaylist
            loading={loading}
            error={error}
            playlist={currentPlaylist}
            paginationFetcher={fetchCurrentPlaylistMore} />
    );
};
