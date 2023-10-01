import { tabTypes } from "@vk-audiopad/common";
import { Group, Spacing } from "@vkontakte/vkui";
import { FC } from "react";
import { InfinityContent } from "shared/ui/components";
import { SkeletonTitleTracks } from "shared/ui/skeletons";
import { Navigation } from "widgets/navigation";
import { TrackList } from "widgets/playlists";
import { useBlockPlaylistData, useLoadMoreBlockPlaylistTracksMutation } from "./hooks";

type PlaylistTracksProps = {
    userId: string;
    selectedTab: tabTypes.TSelectedTabPlaylist;
};

export const PlaylistTracks: FC<PlaylistTracksProps> = ({ userId, selectedTab }) => {
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
                <Spacing />

                {isLoading && <SkeletonTitleTracks />}

                {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                    <TrackList playlist={fetchResult.playlist} />
                )}
            </Group>
        </InfinityContent>
    );
};
