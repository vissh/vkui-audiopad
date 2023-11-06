import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { Content } from "shared/ui/content";
import { EmptyResult } from "shared/ui/empty-result";
import { CompositePlaylist } from "widgets/composite-playlist";
import { NavigationWithSearch } from "widgets/navigation";
import { useSearchData } from "../model/hooks";

type SearchResultProps = {
    userId: string;
    searchValue: string;
};

export const SearchResult: FC<SearchResultProps> = ({ userId, searchValue }) => {
    const { data: playlistBlocks, isLoading, error } = useSearchData(userId, searchValue);

    const firstPlaylistBlock = !!playlistBlocks && playlistBlocks.length > 0 && playlistBlocks[0];
    const otherPlaylistsBlocks = playlistBlocks ? playlistBlocks.slice(1) : [undefined, undefined];

    return (
        <Content error={error}>
            <Group>
                <NavigationWithSearch />

                <CompositePlaylist
                    mode="plain"
                    isLoading={isLoading}
                    loadingBlock="tracks"
                    userId={userId}
                    playlistBlock={firstPlaylistBlock || undefined}
                />

                {!isLoading && !firstPlaylistBlock && <EmptyResult />}
            </Group>

            {otherPlaylistsBlocks.map((playlistBlock) => (
                <CompositePlaylist
                    mode="card"
                    isLoading={isLoading}
                    loadingBlock="albums"
                    userId={userId}
                    playlistBlock={playlistBlock}
                />
            ))}
        </Content>
    );
};
