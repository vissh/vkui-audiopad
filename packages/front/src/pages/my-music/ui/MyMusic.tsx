import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { InfinityContent } from "shared/ui/infinity-content";
import { AlbumGallery } from "widgets/album-gallery";
import { NavigationWithSearch } from "widgets/navigation";
import { TrackGallery } from "widgets/track-gallery";
import { TrackList } from "widgets/track-list";
import { useLoadMoreMyMusicTracksMutation, useMyMusicData } from "../model/hooks";

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

                <TrackGallery
                    mode="plain"
                    isLoading={isLoading}
                    userId={userId}
                    playlist={fetchResult?.recentTracksPlaylist}
                />
            </Group>

            <AlbumGallery
                mode="card"
                isLoading={isLoading}
                title="Плейлисты"
                userId={userId}
                albums={fetchResult?.albums}
                showAllLink={
                    fetchResult && fetchResult.albums.length > 5
                        ? `/audios${userId}?block=my_playlists&section=all`
                        : undefined
                }
            />

            <TrackGallery
                mode="card"
                isLoading={isLoading}
                userId={userId}
                playlist={fetchResult?.radiostationsPlaylist}
            />

            {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                <Group>
                    <TrackList
                        isLoading={isLoading}
                        playlist={fetchResult.playlist}
                        header={fetchResult.playlist.title}
                    />
                </Group>
            )}
        </InfinityContent>
    );
};
