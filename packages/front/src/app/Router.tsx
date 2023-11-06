import { baseEnums } from "@vk-audiopad/common";
import { selectedTabAtom } from "entities/navigation";
import { Albums } from "pages/albums";
import { ArtistResult } from "pages/artist";
import { CurrentPlaylist } from "pages/current-playlist-tracks";
import { Explore } from "pages/explore";
import { General } from "pages/general";
import { MyMusic } from "pages/my-music";
import { PlaylistTracks } from "pages/playlist-tracks";
import { SearchResult } from "pages/search-result";
import { FC, useEffect } from "react";
import { useAtomValue } from "shared/lib/atom";
import { userIdAtom } from "shared/model/storage-atoms";

export const Router: FC = () => {
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
                    searchValue={selectedTab.value}
                />
            )}
            {selectedTab.tab === baseEnums.EContentTab.ALBUMS && (
                <Albums
                    userId={userId}
                    showAllLink={selectedTab.showAllLink}
                />
            )}
            {selectedTab.tab === baseEnums.EContentTab.BLOCK_PLAYLIST && (
                <PlaylistTracks
                    userId={userId}
                    playlist={selectedTab.playlist}
                    fromId={selectedTab.fromId}
                />
            )}
            {selectedTab.tab === baseEnums.EContentTab.ARTIST && (
                <ArtistResult
                    userId={userId}
                    artistId={selectedTab.id}
                    artistName={selectedTab.name}
                />
            )}
        </>
    );
};
