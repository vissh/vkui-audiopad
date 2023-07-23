import { tabTypes, utils } from "@vk-audiopad/common";
import { Group, List } from "@vkontakte/vkui";
import { FC } from "react";
import { TCoverPlaylist } from "shared/types";
import { InfinityContent } from "shared/ui/components";
import { SkeletonCoverPlaylists } from "shared/ui/skeletons";
import { Navigation } from "widgets/navigation";
import { HorizontalCoverPlaylists } from "widgets/playlists";
import { useCoverPlaylistsData, useLoadMoreCoverPlaylistsDataMutation } from "./hooks";

type CoverPlaylistsProps = {
    userId: string;
    selectedTab: tabTypes.TSelectedTabCoverPlaylists;
};

export const CoverPlaylists: FC<CoverPlaylistsProps> = ({ userId, selectedTab }) => {
    const { data: fetchResult, isLoading, error } = useCoverPlaylistsData(selectedTab.showAllLink);
    const loadMoreMutation = useLoadMoreCoverPlaylistsDataMutation(selectedTab.showAllLink);

    const columnsPlaylists: TCoverPlaylist[][] = fetchResult
        ? Array.from(utils.chunked(fetchResult.coverPlaylists, 5))
        : [];

    return (
        <InfinityContent
            hasMore={!!((fetchResult && fetchResult.nextFrom) || "")}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
            error={error}
        >
            <Group>
                <Navigation />

                {isLoading && <SkeletonCoverPlaylists />}

                <List>
                    {columnsPlaylists.map((playlists) => (
                        <HorizontalCoverPlaylists
                            userId={userId}
                            playlists={playlists}
                        />
                    ))}
                </List>
            </Group>
        </InfinityContent>
    );
};
