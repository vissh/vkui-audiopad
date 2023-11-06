import { FC } from "react";
import { TAlbum } from "shared/types";
import { SkeletonWrapper } from "shared/ui/skeleton-wrapper";
import { AlbumGallery } from "./AlbumGallery";
import { AlbumGallerySkeleton } from "./AlbumGallerySkeleton";

type WrappedAlbumGalleryProps = {
    mode: "plain" | "card";
    isLoading: boolean;
    userId: string;
    title: string;
    albums: TAlbum[] | undefined;
    showAllLink: string | undefined;
};

export const WrappedAlbumGallery: FC<WrappedAlbumGalleryProps> = ({
    mode,
    isLoading,
    userId,
    title,
    albums,
    showAllLink,
}) => {
    return (
        <SkeletonWrapper
            mode={mode}
            isLoading={isLoading}
            skeleton={<AlbumGallerySkeleton />}
        >
            {albums && albums.length > 0 ? (
                <AlbumGallery
                    mode={mode}
                    userId={userId}
                    title={title}
                    albums={albums}
                    showAllLink={showAllLink || ""}
                />
            ) : null}
        </SkeletonWrapper>
    );
};
