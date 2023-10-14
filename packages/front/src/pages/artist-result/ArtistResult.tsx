import { tabTypes } from "@vk-audiopad/common";
import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { ArtistCover, Content, EmptyResult } from "shared/ui/components";
import { SkeletonHorizontalCoverPlaylists, SkeletonHorizontalTitleTracks } from "shared/ui/skeletons";
import { Navigation } from "widgets/navigation";
import { HorizontalPlaylist } from "widgets/playlists";
import { useArtistData } from "./hooks";

type ArtistResultProps = {
    userId: string;
    selectedTab: tabTypes.TSelectedTabArtist;
};

export const ArtistResult: FC<ArtistResultProps> = ({ userId, selectedTab }) => {
    const { data: fetchResult, isLoading, error } = useArtistData(userId, selectedTab.id);

    const firstPlaylistBlock =
        fetchResult &&
        !!fetchResult.playlistBlocks &&
        fetchResult.playlistBlocks.length > 0 &&
        fetchResult.playlistBlocks[0];

    const otherPlaylistsBlocks = fetchResult && !!fetchResult.playlistBlocks && fetchResult.playlistBlocks.slice(1);

    return (
        <Content error={error}>
            <Group>
                <Navigation>
                    <ArtistCover
                        title={isLoading ? "" : selectedTab.name}
                        backgroundImage={fetchResult?.backgroundImage || ""}
                    />
                </Navigation>

                {isLoading && <SkeletonHorizontalTitleTracks />}

                {!isLoading && !firstPlaylistBlock && <EmptyResult />}

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
                        <SkeletonHorizontalCoverPlaylists />
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
        </Content>
    );
};
