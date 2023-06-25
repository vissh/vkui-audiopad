import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { HorizontalPlaylist } from "../../../components/HorizontalPlaylist";
import { InfinityContent } from "../../../components/InfiniteContent";
import { Navigation } from "../Navigation";
import { useExploreData, useLoadMoreExploreDataMutation } from "./hooks";

type Props = {
    userId: string;
};

export const Explore: FC<Props> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useExploreData(userId);
    const loadMoreMutation = useLoadMoreExploreDataMutation();

    const firstPlaylistBlock = !!fetchResult && fetchResult.playlistBlocks.length > 0 && fetchResult.playlistBlocks[0];
    const otherPlaylistsBlocks = !!fetchResult && fetchResult.playlistBlocks.slice(1);

    return (
        <InfinityContent
            isLoading={isLoading}
            hasMore={!!fetchResult?.nextFrom}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
            error={error}
        >
            <Group>
                <Navigation />
                {firstPlaylistBlock && (
                    <HorizontalPlaylist
                        userId={userId}
                        playlistBlock={firstPlaylistBlock}
                        wrapGroup={false} />
                )}
            </Group>

            {otherPlaylistsBlocks && otherPlaylistsBlocks.length > 0 &&
                otherPlaylistsBlocks.map((playlistBlock) =>
                    <HorizontalPlaylist
                        userId={userId}
                        playlistBlock={playlistBlock}
                        wrapGroup={true} />
                )}

        </InfinityContent>
    );
};
