import { Group, Spacing } from "@vkontakte/vkui";
import { FC } from "react";
import { EPlaylistDataType, TAlbumsBlock } from "shared/types";
import { InfinityContent } from "shared/ui/infinity-content";
import { AlbumList } from "widgets/album-list";
import { CompositePlaylist } from "widgets/composite-playlist";
import { NavigationWithSearch } from "widgets/navigation";
import { useAlbumsData, useLoadMoreAlbumsDataMutation } from "../model/hooks";

type AlbumsProps = {
    userId: string;
    showAllLink: string;
};

export const Albums: FC<AlbumsProps> = ({ userId, showAllLink }) => {
    const { data: fetchResult, isLoading, error } = useAlbumsData(showAllLink);
    const loadMoreMutation = useLoadMoreAlbumsDataMutation(showAllLink);

    const albumBlocks = (fetchResult?.playlistBlocks || []).filter(
        (pb): pb is TAlbumsBlock => pb.dataType === EPlaylistDataType.ALBUMS,
    );
    const firstAlbumBlock = albumBlocks.length > 0 ? albumBlocks[0] : null;
    const otherAlbumBlocks = albumBlocks.length > 1 ? albumBlocks.slice(1) : [];

    return (
        <InfinityContent
            hasMore={!!((fetchResult && fetchResult.nextFrom) || "")}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
            error={error}
        >
            <Group>
                <NavigationWithSearch />

                {isLoading || albumBlocks.length === 1 ? (
                    <>
                        <Spacing />
                        <AlbumList
                            isLoading={isLoading}
                            userId={userId}
                            albums={firstAlbumBlock?.albums}
                        />
                    </>
                ) : (
                    <CompositePlaylist
                        mode="plain"
                        isLoading={isLoading}
                        loadingBlock="albums"
                        userId={userId}
                        playlistBlock={firstAlbumBlock || undefined}
                    />
                )}
            </Group>

            {otherAlbumBlocks.map((albumBlock) => (
                <CompositePlaylist
                    mode="card"
                    isLoading={isLoading}
                    loadingBlock="albums"
                    userId={userId}
                    playlistBlock={albumBlock}
                />
            ))}
        </InfinityContent>
    );
};
