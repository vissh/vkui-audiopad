import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { sendEventControlSearchArtist, sendEventSearchArtist } from "shared/lib/analytics";
import { useAtom } from "shared/lib/atom";
import { ArtistTitle } from "./ArtistTitle";

type SearchArtistTitleProps = {
    track: baseTypes.TTrackItem;
    context?: "controls";
};

export const SearchArtistTitle: FC<SearchArtistTitleProps> = ({ track, context }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    const onSearch = (value: string) => {
        setSelectedTab({
            tab: baseEnums.EContentTab.SEARCH,
            value: value,
        });

        context === undefined ? sendEventSearchArtist(selectedTab.tab) : sendEventControlSearchArtist();
    };

    const onArtist = (artist: baseTypes.TArtist) => {
        setSelectedTab({
            tab: baseEnums.EContentTab.ARTIST,
            id: artist.id,
            name: artist.name,
            history: [{ tab: baseEnums.EContentTab.GENERAL }],
        });

        context === undefined ? sendEventSearchArtist(selectedTab.tab) : sendEventControlSearchArtist();
    };

    return (
        <ArtistTitle
            track={track}
            onSearch={onSearch}
            onArtist={onArtist}
        />
    );
};
