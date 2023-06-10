import { tabTypes } from "@vk-audiopad/common";
import { FC } from "react";
import { InfinityContent } from "../../../components/InfiniteContent";
import { TitleTracks } from "../../../components/TitleTracks";
import { useBlockPlaylistData, useLoadMoreBlockPlaylistTracksMutation } from "./hooks";

type Props = {
    selectedTab: tabTypes.TSelectedPlaylist;
};

export const BlockPlaylist: FC<Props> = ({ selectedTab }) => {
    const { data: fetchResult, isLoading } = useBlockPlaylistData(selectedTab);
    const loadMoreMutation = useLoadMoreBlockPlaylistTracksMutation();

    return (
        <InfinityContent
            isLoading={isLoading}
            hasMore={!!fetchResult?.playlist.hasMore}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={fetchResult?.playlist}
        >
            {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                <>
                    {<TitleTracks playlist={fetchResult.playlist} />}
                </>
            )}
        </InfinityContent>
    );
};
