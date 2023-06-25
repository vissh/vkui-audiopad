import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { HorizontalTitleCoverPlaylists } from "../../../components/HorizontalTitleCoverPlaylists";
import { HorizantalTitleTracks } from "../../../components/HorizontalTitleTracks";
import { InfinityContent } from "../../../components/InfiniteContent";
import { TitleTracks } from "../../../components/TitleTracks";
import { Navigation } from "../Navigation";
import { useLoadMoreMyMusicTracksMutation, useMyMusicData } from "./hooks";

type Props = {
    userId: string;
};

export const MyMusic: FC<Props> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useMyMusicData(userId);
    const loadMoreMutation = useLoadMoreMyMusicTracksMutation();

    return (
        <InfinityContent
            isLoading={isLoading}
            hasMore={!!fetchResult?.playlist?.hasMore}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={fetchResult?.playlist}
            error={error}
        >
            <Group>
                <Navigation />
                {fetchResult && fetchResult.recentTracksPlaylist && fetchResult.recentTracksPlaylist.tracks.length > 0 && (
                    <HorizantalTitleTracks
                        userId={userId}
                        playlist={fetchResult.recentTracksPlaylist}
                    />
                )}
            </Group>

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

            {fetchResult && fetchResult.radiostationsPlaylist && fetchResult.radiostationsPlaylist.tracks.length > 0 && (
                <Group>
                    <HorizantalTitleTracks
                        userId={userId}
                        playlist={fetchResult.radiostationsPlaylist}
                    />
                </Group>
            )}

            {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                <Group>
                    <TitleTracks playlist={fetchResult.playlist} />
                </Group>
            )}

        </InfinityContent>
    );
};
