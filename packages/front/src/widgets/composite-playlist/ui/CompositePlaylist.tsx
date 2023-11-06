import { FC } from "react";
import { EPlaylistDataType, TPlaylistBlock } from "shared/types";
import { AlbumGallery } from "widgets/album-gallery";
import { TrackGallery } from "widgets/track-gallery";

type CompositePlaylistProps = {
    mode: "plain" | "card";
    isLoading: boolean;
    loadingBlock: "tracks" | "albums";
    userId: string;
    playlistBlock: TPlaylistBlock | undefined;
};

export const CompositePlaylist: FC<CompositePlaylistProps> = ({
    mode,
    isLoading,
    loadingBlock,
    userId,
    playlistBlock,
}) => {
    return (isLoading && loadingBlock === "tracks") || playlistBlock?.dataType === EPlaylistDataType.TRACKS ? (
        <TrackGallery
            mode={mode}
            isLoading={isLoading}
            userId={userId}
            playlist={playlistBlock?.dataType === EPlaylistDataType.TRACKS ? playlistBlock?.playlist : undefined}
        />
    ) : (
        <AlbumGallery
            mode={mode}
            isLoading={isLoading}
            title={playlistBlock?.title || ""}
            userId={userId}
            albums={playlistBlock?.albums}
            showAllLink={playlistBlock?.showAllLink}
        />
    );
};
