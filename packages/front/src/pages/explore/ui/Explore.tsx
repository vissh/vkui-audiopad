import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { InfinityContent } from "shared/ui/infinity-content";
import { CompositePlaylist } from "widgets/composite-playlist";
import { NavigationWithSearch } from "widgets/navigation";
import { useExploreData, useLoadMoreExploreDataMutation } from "../model/hooks";

type ExploreProps = {
    userId: string;
};

export const Explore: FC<ExploreProps> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useExploreData(userId);
    const loadMoreMutation = useLoadMoreExploreDataMutation();

    const firstPlaylistBlock = !!fetchResult && fetchResult.playlistBlocks.length > 0 && fetchResult.playlistBlocks[0];
    const otherPlaylistsBlocks = fetchResult ? fetchResult.playlistBlocks.slice(1) : [undefined, undefined];

    return (
        <InfinityContent
            hasMore={!!fetchResult?.nextFrom}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
            error={error}
        >
            <Group>
                <NavigationWithSearch />

                <CompositePlaylist
                    mode="plain"
                    isLoading={isLoading}
                    loadingBlock="tracks"
                    userId={userId}
                    playlistBlock={firstPlaylistBlock || undefined}
                />
            </Group>

            {otherPlaylistsBlocks.map((playlistBlock) => (
                <CompositePlaylist
                    mode="card"
                    isLoading={isLoading}
                    loadingBlock="albums"
                    userId={userId}
                    playlistBlock={playlistBlock}
                />
            ))}
        </InfinityContent>
    );
};
