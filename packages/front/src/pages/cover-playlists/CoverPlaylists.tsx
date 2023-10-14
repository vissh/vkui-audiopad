import { tabTypes } from "@vk-audiopad/common";
import { Group, Spacing } from "@vkontakte/vkui";
import { FC } from "react";
import { InfinityContent } from "shared/ui/components";
import { SkeletonCoverPlaylists } from "shared/ui/skeletons";
import { NavigationWithSearch } from "widgets/navigation";
import { CoverPlaylistsList } from "widgets/playlists/CoverPlaylistsList";
import { useCoverPlaylistsData, useLoadMoreCoverPlaylistsDataMutation } from "./hooks";

type CoverPlaylistsProps = {
    userId: string;
    selectedTab: tabTypes.TSelectedTabCoverPlaylists;
};

export const CoverPlaylists: FC<CoverPlaylistsProps> = ({ userId, selectedTab }) => {
    const { data: fetchResult, isLoading, error } = useCoverPlaylistsData(selectedTab.showAllLink);
    const loadMoreMutation = useLoadMoreCoverPlaylistsDataMutation(selectedTab.showAllLink);

    return (
        <InfinityContent
            hasMore={!!((fetchResult && fetchResult.nextFrom) || "")}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
            error={error}
        >
            <Group>
                <NavigationWithSearch />
                <Spacing />

                {isLoading && <SkeletonCoverPlaylists />}

                {fetchResult && (
                    <CoverPlaylistsList
                        userId={userId}
                        coverPlaylists={fetchResult.coverPlaylists}
                    />
                )}
            </Group>
        </InfinityContent>
    );
};
