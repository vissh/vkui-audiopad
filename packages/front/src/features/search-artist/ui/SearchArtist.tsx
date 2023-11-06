import { baseTypes } from "@vk-audiopad/common";
import { useSetArtist, useSetSearch } from "entities/navigation";
import { FC } from "react";
import { ArtistTitle } from "shared/ui/artist-title";

type SearchArtistProps = {
    track: baseTypes.TTrackItem;
};

export const SearchArtist: FC<SearchArtistProps> = ({ track }) => {
    const setArtist = useSetArtist();
    const setSearch = useSetSearch();

    return (
        <ArtistTitle
            track={track}
            onSearch={(value) => setSearch(value)}
            onArtist={(artist) => setArtist(artist)}
        />
    );
};
