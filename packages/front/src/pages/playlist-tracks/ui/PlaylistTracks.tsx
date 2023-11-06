import { baseTypes } from "@vk-audiopad/common";
import { Group, Spacing } from "@vkontakte/vkui";
import { FC } from "react";
import { InfinityContent } from "shared/ui/infinity-content";
import { NavigationWithSearch } from "widgets/navigation";
import { TrackList } from "widgets/track-list";
import { useBlockPlaylistData, useLoadMoreBlockPlaylistTracksMutation } from "../model/hooks";

type PlaylistTracksProps = {
    userId: string;
    playlist: baseTypes.TTitlePlaylist;
    fromId: string;
};

export const PlaylistTracks: FC<PlaylistTracksProps> = ({ userId, playlist, fromId }) => {
    const { data: fetchResult, isLoading, error } = useBlockPlaylistData(userId, playlist, fromId);
    const loadMoreMutation = useLoadMoreBlockPlaylistTracksMutation();

    return (
        <InfinityContent
            hasMore={!!fetchResult?.playlist.hasMore}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={fetchResult?.playlist}
            error={error}
        >
            <Group>
                <NavigationWithSearch />
                <Spacing />

                <TrackList
                    isLoading={isLoading}
                    playlist={fetchResult?.playlist}
                />
            </Group>
        </InfinityContent>
    );
};
