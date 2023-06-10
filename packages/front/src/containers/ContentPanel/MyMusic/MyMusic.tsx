import { FC } from "react";
import { Content } from "../../../components/Content";
import { HorizontalTitleCoverPlaylists } from "../../../components/HorizontalTitleCoverPlaylists";
import { HorizantalTitleTracks } from "../../../components/HorizontalTitleTracks";
import { InfinityContent } from "../../../components/InfiniteContent";
import { TitleTracks } from "../../../components/TitleTracks";
import { useLoadMoreMyMusicTracksMutation, useMyMusicData } from "./hooks";

type Props = {
    userId: string;
};

export const MyMusic: FC<Props> = ({ userId }) => {
    const { data: fetchResult, isLoading } = useMyMusicData(userId);
    const loadMoreMutation = useLoadMoreMyMusicTracksMutation();

    return (
        <Content loading={isLoading} error={null}>
            {fetchResult &&
                <>
                    {fetchResult.recentTracksPlaylist && fetchResult.recentTracksPlaylist.tracks.length > 0 && (
                        <HorizantalTitleTracks
                            userId={userId}
                            playlist={fetchResult.recentTracksPlaylist}
                        />
                    )}

                    {fetchResult.coverPlaylists.length > 0 && (
                        <HorizontalTitleCoverPlaylists
                            userId={userId}
                            title={"Плейлисты"}
                            playlists={fetchResult.coverPlaylists}
                            showMore={true}
                        />
                    )}

                    {fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                        <InfinityContent
                            hasMore={!!fetchResult.playlist.hasMore}
                            loadMoreMutation={loadMoreMutation}
                            loadMoreArgs={fetchResult.playlist}
                        >
                            {<TitleTracks playlist={fetchResult.playlist} />}
                        </InfinityContent>
                    )}
                </>
            }
        </Content>
    );
};
