import { types } from "@vk-audiopad/common";
import { FC } from "react";
import { TypeFetchError } from "../../store/types";
import { PaginationContent } from "./PaginationContent";
import { TitleTracks } from "./TitleTracks";

type Props = {
    loading: boolean;
    error: TypeFetchError | null;
    paginationFetcher: Function;
    playlist: types.TypeTitlePlaylist | null;
};

export const PaginationPlaylist: FC<Props> = ({ loading, error, paginationFetcher, playlist }) => {
    return (
        <PaginationContent
            loading={loading}
            error={error}
            paginationFetcher={() => paginationFetcher(playlist)}
            needMore={() => !!(playlist && playlist.hasMore)}
        >
            {playlist && playlist.tracks.length > 0 && <TitleTracks playlist={playlist} />}
        </PaginationContent>
    )
};
