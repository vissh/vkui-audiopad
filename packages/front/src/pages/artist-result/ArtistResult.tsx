import { tabTypes } from "@vk-audiopad/common";
import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { Content, EmptyResult } from "shared/ui/components";
import { SkeletonHorizontalCoverPlaylists, SkeletonHorizontalTitleTracks } from "shared/ui/skeletons";
import { Navigation } from "widgets/navigation";
import { HorizontalPlaylist } from "widgets/playlists";
import { useArtistData } from "./hooks";

type ArtistResultProps = {
    userId: string;
    selectedTab: tabTypes.TSelectedTabArtist;
};

export const ArtistResult: FC<ArtistResultProps> = ({ userId, selectedTab }) => {
    const { data: playlistBlocks, isLoading, error } = useArtistData(userId, selectedTab.id);

    const firstPlaylistBlock = !!playlistBlocks && playlistBlocks.length > 0 && playlistBlocks[0];
    const otherPlaylistsBlocks = !!playlistBlocks && playlistBlocks.slice(1);

    return (
        <Content error={error}>
            <Group>
                <Navigation />

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
