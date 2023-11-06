import { Group, Header } from "@vkontakte/vkui";
import { FC } from "react";
import { TAlbum } from "shared/types";
import { SkeletonWrapper } from "shared/ui/skeleton-wrapper";
import { CardGallery } from "./CardGallery";
import { CardGallerySkeleton } from "./CardGallerySkeleton";

type WrappedCardGalleryProps = {
    isLoading: boolean;
    title: string;
    userId: string;
    albums: TAlbum[] | undefined;
};

export const WrappedCardGallery: FC<WrappedCardGalleryProps> = ({ isLoading, title, userId, albums }) => {
    return (
        <SkeletonWrapper
            mode="card"
            isLoading={isLoading}
            skeleton={<CardGallerySkeleton />}
        >
            {albums && albums.length > 0 ? (
                <Group header={<Header>{title}</Header>}>
                    <CardGallery
                        userId={userId}
                        albums={albums}
                    />
                </Group>
            ) : null}
        </SkeletonWrapper>
    );
};
