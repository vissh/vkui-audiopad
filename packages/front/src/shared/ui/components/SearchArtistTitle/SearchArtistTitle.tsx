import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { useAtom } from "shared/lib/atom";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { sendEventControlSearchArtist, sendEventSearchArtist } from "shared/lib/analytics";
import { ArtistTitle } from "./ArtistTitle";

type SearchArtistTitleProps = {
    track: baseTypes.TTrackItem;
    context?: "controls";
};

export const SearchArtistTitle: FC<SearchArtistTitleProps> = ({ track, context }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    const onClick = (value: string) => {
        setSelectedTab({
            tab: baseEnums.EContentTab.SEARCH,
            value: value,
        });

        context === undefined ? sendEventSearchArtist(selectedTab.tab) : sendEventControlSearchArtist();
    };

    return (
        <ArtistTitle
            track={track}
            onClick={onClick}
        />
    );
};
