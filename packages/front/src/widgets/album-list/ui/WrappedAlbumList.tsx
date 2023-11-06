import { FC } from "react";
import { TAlbum } from "shared/types";
import { SkeletonWrapper } from "shared/ui/skeleton-wrapper";
import { AlbumList } from "./AlbumList";
import { AlbumListSkeleton } from "./AlbumListSkeleton";

type WrappedAlbumListProps = {
    isLoading: boolean;
    userId: string;
    albums: TAlbum[] | undefined;
};

export const WrappedAlbumList: FC<WrappedAlbumListProps> = ({ isLoading, userId, albums }) => {
    return (
        <SkeletonWrapper
            mode="plain"
            isLoading={isLoading}
            skeleton={<AlbumListSkeleton />}
        >
            {albums && albums.length > 0 ? (
                <AlbumList
                    userId={userId}
                    albums={albums}
                />
            ) : null}
        </SkeletonWrapper>
    );
};
