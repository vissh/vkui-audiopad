import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { InfinityContent } from "shared/ui/components";
import { SkeletonHorizontalCoverPlaylists, SkeletonHorizontalTitleTracks } from "shared/ui/skeletons";
import { NavigationWithSearch } from "widgets/navigation";
import { HorizontalPlaylist } from "widgets/playlists";
import { useExploreData, useLoadMoreExploreDataMutation } from "./hooks";

type ExploreProps = {
    userId: string;
};

export const Explore: FC<ExploreProps> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useExploreData(userId);
    const loadMoreMutation = useLoadMoreExploreDataMutation();

    const firstPlaylistBlock = !!fetchResult && fetchResult.playlistBlocks.length > 0 && fetchResult.playlistBlocks[0];
    const otherPlaylistsBlocks = !!fetchResult && fetchResult.playlistBlocks.slice(1);

    return (
        <InfinityContent
            hasMore={!!fetchResult?.nextFrom}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
            error={error}
        >
            <Group>
                <NavigationWithSearch />

                {isLoading && <SkeletonHorizontalTitleTracks />}

                {firstPlaylistBlock && (
                    <HorizontalPlaylist
                        userId={userId}
                        playlistBlock={firstPlaylistBlock}
                        wrapGroup={false}
                    />
                )}
            </Group>

            {isLoading && (
                <>
                    <Group>
                        <SkeletonHorizontalTitleTracks />
                    </Group>
                    <Group>
                        <SkeletonHorizontalCoverPlaylists />
                    </Group>
                </>
            )}

            {otherPlaylistsBlocks &&
                otherPlaylistsBlocks.length > 0 &&
                otherPlaylistsBlocks.map((playlistBlock) => (
                    <HorizontalPlaylist
                        userId={userId}
                        playlistBlock={playlistBlock}
                        wrapGroup={true}
                    />
                ))}
        </InfinityContent>
    );
};
