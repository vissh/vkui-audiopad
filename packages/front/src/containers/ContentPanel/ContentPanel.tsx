import { baseEnums } from "@vk-audiopad/common";
import { FC } from "react";
import { useAtomValue } from "../../core/atom";
import { selectedTabAtom, userIdAtom } from "../../core/atoms";
import { BlockPlaylist } from "./BlockPlaylist/BlockPlaylist";
import { CoverPlaylists } from "./CoverPlaylists/CoverPlaylists";
import { CurrentPlaylist } from "./CurrentPlaylist/CurrentPlaylist";
import { Explore } from "./Explore/Explore";
import { General } from "./General/General";
import { MyMusic } from "./MyMusic/MyMusic";
import { SearchResult } from "./SearchResult/SearchResult";

export const ContentPanel: FC = () => {
    const userId = useAtomValue(userIdAtom);
    const selectedTab = useAtomValue(selectedTabAtom);

    return (
        <>
            {selectedTab.tab === baseEnums.EContentTab.CURRENT_PLAYLIST && <CurrentPlaylist />}
            {selectedTab.tab === baseEnums.EContentTab.GENERAL && <General userId={userId} />}
            {selectedTab.tab === baseEnums.EContentTab.MY_MUSIC && <MyMusic userId={userId} />}
            {selectedTab.tab === baseEnums.EContentTab.EXPLORE && <Explore userId={userId} />}
            {selectedTab.tab === baseEnums.EContentTab.SEARCH && <SearchResult userId={userId} selectedTab={selectedTab} />}
            {selectedTab.tab === baseEnums.EContentTab.COVER_PLAYLISTS && <CoverPlaylists userId={userId} selectedTab={selectedTab} />}
            {selectedTab.tab === baseEnums.EContentTab.BLOCK_PLAYLIST && <BlockPlaylist userId={userId} selectedTab={selectedTab} />}
        </>
    );
};
