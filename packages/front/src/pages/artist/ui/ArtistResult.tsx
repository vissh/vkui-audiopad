import { Group } from "@vkontakte/vkui";
import { Navigation } from "entities/navigation";
import { FC } from "react";
import { ArtistCover } from "shared/ui/artist-cover";
import { Content } from "shared/ui/content";
import { EmptyResult } from "shared/ui/empty-result";
import { CompositePlaylist } from "widgets/composite-playlist";
import { useArtistData } from "../model/hooks";

type ArtistResultProps = {
    userId: string;
    artistId: string;
    artistName: string;
};

export const ArtistResult: FC<ArtistResultProps> = ({ userId, artistId, artistName }) => {
    const { data: fetchResult, isLoading, error } = useArtistData(userId, artistId);

    const firstPlaylistBlock =
        fetchResult &&
        !!fetchResult.playlistBlocks &&
        fetchResult.playlistBlocks.length > 0 &&
        fetchResult.playlistBlocks[0];

    const otherPlaylistsBlocks = fetchResult ? fetchResult.playlistBlocks.slice(1) : [undefined, undefined];

    return (
        <Content error={error}>
            <Group>
                <Navigation>
                    <ArtistCover
                        title={isLoading ? "" : artistName}
                        backgroundImage={fetchResult?.backgroundImage || ""}
                    />
                </Navigation>

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
