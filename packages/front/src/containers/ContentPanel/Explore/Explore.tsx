import { FC } from "react";
import { HorizantalTitleTracks } from "../../../components/HorizontalTitleTracks";
import { InfinityContent } from "../../../components/InfiniteContent";
import { useExploreData, useLoadMoreExploreDataMutation } from "./hooks";

type Props = {
    userId: string;
};

export const Explore: FC<Props> = ({ userId }) => {
    const { data: fetchResult, isLoading } = useExploreData(userId);
    const loadMoreMutation = useLoadMoreExploreDataMutation();

    return (
        <InfinityContent
            isLoading={isLoading}
            hasMore={!!fetchResult?.nextFrom}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
        >
            {fetchResult && fetchResult.playlists.length > 0 &&
                <>
                    {fetchResult.playlists.map((playlist) => <HorizantalTitleTracks userId={userId} playlist={playlist} />)}
                </>
            }
        </InfinityContent>
    );
};
