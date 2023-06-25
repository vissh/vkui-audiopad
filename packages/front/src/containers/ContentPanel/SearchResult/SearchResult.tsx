import { tabTypes } from "@vk-audiopad/common";
import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { Content } from "../../../components/Content";
import { HorizontalPlaylist } from "../../../components/HorizontalPlaylist";
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
        <Content loading={isLoading} error={error}>
            <Group>
                <Navigation />
                {firstPlaylistBlock && (
                    <HorizontalPlaylist
                        userId={userId}
                        playlistBlock={firstPlaylistBlock}
                        wrapGroup={false} />
                )}
            </Group>

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
