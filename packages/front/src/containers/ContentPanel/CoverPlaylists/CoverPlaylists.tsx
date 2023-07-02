import { tabTypes, utils } from "@vk-audiopad/common";
import { Group, List } from "@vkontakte/vkui";
import { FC } from "react";
import { HorizantalCoverPlaylists } from "../../../components/HorizontalCoverPlaylists";
import { InfinityContent } from "../../../components/InfiniteContent";
import { TCoverPlaylist } from "../../../core/types/playlists";
import { SkeletonCoverPlaylists } from "../../../skeletons/SkeletonCoverPlaylists";
import { Navigation } from "../Navigation";
import { useCoverPlaylistsData, useLoadMoreCoverPlaylistsDataMutation } from "./hooks";

type Props = {
    userId: string;
    selectedTab: tabTypes.TSelectedTabCoverPlaylists;
};

export const CoverPlaylists: FC<Props> = ({ userId, selectedTab }) => {
    const { data: fetchResult, isLoading, error } = useCoverPlaylistsData(selectedTab.showAllLink);
    const loadMoreMutation = useLoadMoreCoverPlaylistsDataMutation(selectedTab.showAllLink);

    const columnsPlaylists: TCoverPlaylist[][] =
        fetchResult
            ? Array.from(utils.chunked(fetchResult.coverPlaylists, 5))
            : [];

    return (
        <InfinityContent
            hasMore={!!(fetchResult && fetchResult.nextFrom || "")}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
            error={error}
        >
            <Group>
                <Navigation />

                {isLoading && <SkeletonCoverPlaylists />}

                <List>
                    {columnsPlaylists.map(playlists => (
                        <HorizantalCoverPlaylists
                            userId={userId}
                            playlists={playlists}
                        />
                    ))}
                </List>
            </Group>
        </InfinityContent>
    );
};
