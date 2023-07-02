import { tabTypes } from "@vk-audiopad/common";
import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { InfinityContent } from "../../../components/InfiniteContent";
import { TitleTracks } from "../../../components/TitleTracks";
import { SkeletonTitleTracks } from "../../../skeletons/SkeletonTitleTracks";
import { Navigation } from "../Navigation";
import { useBlockPlaylistData, useLoadMoreBlockPlaylistTracksMutation } from "./hooks";

type Props = {
    userId: string,
    selectedTab: tabTypes.TSelectedTabPlaylist;
};

export const BlockPlaylist: FC<Props> = ({ userId, selectedTab }) => {
    const { data: fetchResult, isLoading, error } = useBlockPlaylistData(userId, selectedTab);
    const loadMoreMutation = useLoadMoreBlockPlaylistTracksMutation();

    return (
        <InfinityContent
            hasMore={!!fetchResult?.playlist.hasMore}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={fetchResult?.playlist}
            error={error}
        >
            <Group>
                <Navigation />

                {isLoading && <SkeletonTitleTracks />}

                {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                    <TitleTracks playlist={fetchResult.playlist} />
                )}
            </Group>
        </InfinityContent>
    );
};
