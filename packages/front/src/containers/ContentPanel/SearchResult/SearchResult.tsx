import { tabTypes } from "@vk-audiopad/common";
import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { Content } from "../../../components/Content";
import { HorizontalPlaylist } from "../../../components/HorizontalPlaylist";
import { SkeletonHorizontalCoverPlaylists } from "../../../skeletons/SkeletonHorizontalCoverPlaylists";
import { SkeletonHorizontalTitleTracks } from "../../../skeletons/SkeletonHorizontalTitleTracks";
import { Navigation } from "../Navigation";
import { useSearchData } from "./hooks";

type Props = {
    userId: string;
    selectedTab: tabTypes.TSelectedTabSearch;
};

export const SearchResult: FC<Props> = ({ userId, selectedTab }) => {
    const { data: playlistBlocks, isLoading, error } = useSearchData(userId, selectedTab.value);

    const firstPlaylistBlock = !!playlistBlocks && playlistBlocks.length > 0 && playlistBlocks[0];
    const otherPlaylistsBlocks = !!playlistBlocks && playlistBlocks.slice(1);

    return (
        <Content error={error}>
            <Group>
                <Navigation />

                {isLoading && <SkeletonHorizontalTitleTracks />}

                {firstPlaylistBlock && (
                    <HorizontalPlaylist
                        userId={userId}
                        playlistBlock={firstPlaylistBlock}
                        wrapGroup={false} />
                )}
            </Group>

            {isLoading && (
                <>
                    <Group><SkeletonHorizontalCoverPlaylists /></Group>
                    <Group><SkeletonHorizontalCoverPlaylists /></Group>
                </>
            )}

            {otherPlaylistsBlocks && otherPlaylistsBlocks.length > 0 &&
                otherPlaylistsBlocks.map(playlistBlock =>
                    <HorizontalPlaylist
                        userId={userId}
                        playlistBlock={playlistBlock}
                        wrapGroup={true} />
                )}

        </Content>
    );
};
