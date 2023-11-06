import { baseTypes } from "@vk-audiopad/common";
import { FC } from "react";
import { SkeletonWrapper } from "shared/ui/skeleton-wrapper";
import { TrackList } from "./TrackList";
import { SkeletonTitleTracks } from "./TrackListSkeleton";

type WrappedTrackListProps = {
    isLoading: boolean;
    playlist: baseTypes.TTitlePlaylist | undefined;
    header?: string;
};

export const WrappedTrackList: FC<WrappedTrackListProps> = ({ isLoading, playlist, header }) => {
    return (
        <>
            <SkeletonWrapper
                mode="plain"
                isLoading={isLoading}
                skeleton={<SkeletonTitleTracks />}
            >
                {playlist && (
                    <TrackList
                        playlist={playlist}
                        header={header}
                    />
                )}
            </SkeletonWrapper>
        </>
    );
};
