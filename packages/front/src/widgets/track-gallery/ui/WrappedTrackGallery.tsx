import { baseTypes } from "@vk-audiopad/common";
import { FC } from "react";
import { SkeletonWrapper } from "shared/ui/skeleton-wrapper";
import { TrackGallery } from "./TrackGallery";
import { TrackGallerySkeleton } from "./TrackGallerySkeleton";

type WrappedTrackGalleryProps = {
    mode: "plain" | "card";
    isLoading: boolean;
    userId: string;
    playlist: baseTypes.TTitlePlaylist | undefined | null;
};

export const WrappedTrackGallery: FC<WrappedTrackGalleryProps> = ({ mode, isLoading, userId, playlist }) => {
    return (
        <SkeletonWrapper
            mode={mode}
            isLoading={isLoading}
            skeleton={<TrackGallerySkeleton />}
        >
            {!!playlist ? (
                <TrackGallery
                    mode={mode}
                    userId={userId}
                    playlist={playlist}
                />
            ) : null}
        </SkeletonWrapper>
    );
};
