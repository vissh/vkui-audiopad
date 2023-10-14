import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { InfinityContent } from "shared/ui/components";
import { SkeletonHorizontalCoverPlaylists, SkeletonHorizontalTitleTracks } from "shared/ui/skeletons";
import { NavigationWithSearch } from "widgets/navigation";
import { HorizontalTitleCoverPlaylists, HorizontalTitleTracks, TrackList } from "widgets/playlists";
import { useLoadMoreMyMusicTracksMutation, useMyMusicData } from "./hooks";

type MyMusicProps = {
    userId: string;
};

export const MyMusic: FC<MyMusicProps> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useMyMusicData(userId);
    const loadMoreMutation = useLoadMoreMyMusicTracksMutation();

    return (
        <InfinityContent
            hasMore={!!fetchResult?.playlist?.hasMore}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={fetchResult?.playlist}
            error={error}
        >
            <Group>
                <NavigationWithSearch />

                {isLoading && <SkeletonHorizontalTitleTracks />}

                {fetchResult &&
                    fetchResult.recentTracksPlaylist &&
                    fetchResult.recentTracksPlaylist.tracks.length > 0 && (
                        <HorizontalTitleTracks
                            userId={userId}
                            playlist={fetchResult.recentTracksPlaylist}
                        />
                    )}
            </Group>

            {isLoading && (
                <Group>
                    <SkeletonHorizontalCoverPlaylists />
                </Group>
            )}

            {fetchResult && fetchResult.coverPlaylists.length > 0 && (
                <Group>
                    <HorizontalTitleCoverPlaylists
                        title="Плейлисты"
                        userId={userId}
                        playlists={fetchResult.coverPlaylists}
                        showAllLink={`/audios${userId}?block=my_playlists&section=all`}
                        showMore={true}
                    />
                </Group>
            )}

            {fetchResult &&
                fetchResult.radiostationsPlaylist &&
                fetchResult.radiostationsPlaylist.tracks.length > 0 && (
                    <Group>
                        <HorizontalTitleTracks
                            userId={userId}
                            playlist={fetchResult.radiostationsPlaylist}
                        />
                    </Group>
                )}

            {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                <Group>
                    <TrackList
                        playlist={fetchResult.playlist}
                        header={fetchResult.playlist.title}
                    />
                </Group>
            )}
        </InfinityContent>
    );
};
