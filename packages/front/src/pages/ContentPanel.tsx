import { baseEnums } from "@vk-audiopad/common";
import { FC, useEffect } from "react";
import { selectedTabAtom, userIdAtom } from "shared/appAtoms";
import { useAtomValue } from "shared/lib/atom";
import { ArtistResult } from "./artist-result";
import { CoverPlaylists } from "./cover-playlists";
import { CurrentPlaylist } from "./current-playlist-tracks";
import { Explore } from "./explore";
import { General } from "./general";
import { MyMusic } from "./my-music";
import { PlaylistTracks } from "./playlist-tracks";
import { SearchResult } from "./search-result";

export const ContentPanel: FC = () => {
    const userId = useAtomValue(userIdAtom);
    const selectedTab = useAtomValue(selectedTabAtom);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedTab]);

    return (
        <>
            {selectedTab.tab === baseEnums.EContentTab.CURRENT_PLAYLIST && <CurrentPlaylist />}
            {selectedTab.tab === baseEnums.EContentTab.GENERAL && <General userId={userId} />}
            {selectedTab.tab === baseEnums.EContentTab.MY_MUSIC && <MyMusic userId={userId} />}
            {selectedTab.tab === baseEnums.EContentTab.EXPLORE && <Explore userId={userId} />}
            {selectedTab.tab === baseEnums.EContentTab.SEARCH && (
                <SearchResult
                    userId={userId}
                    selectedTab={selectedTab}
                />
            )}
            {selectedTab.tab === baseEnums.EContentTab.COVER_PLAYLISTS && (
                <CoverPlaylists
                    userId={userId}
                    selectedTab={selectedTab}
                />
            )}
            {selectedTab.tab === baseEnums.EContentTab.BLOCK_PLAYLIST && (
                <PlaylistTracks
                    userId={userId}
                    selectedTab={selectedTab}
                />
            )}
            {selectedTab.tab === baseEnums.EContentTab.ARTIST && (
                <ArtistResult
                    userId={userId}
                    selectedTab={selectedTab}
                />
            )}
        </>
    );
};
