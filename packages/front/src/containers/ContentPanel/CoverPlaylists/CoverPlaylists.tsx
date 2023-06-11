import { baseTypes, utils } from "@vk-audiopad/common";
import { List } from "@vkontakte/vkui";
import { FC } from "react";
import { HorizantalCoverPlaylists } from "../../../components/HorizontalCoverPlaylists";
import { InfinityContent } from "../../../components/InfiniteContent";
import { useCoverPlaylistsData, useLoadMoreCoverPlaylistsDataMutation } from "./hooks";

type Props = {
    userId: string;
};

export const CoverPlaylists: FC<Props> = ({ userId }) => {
    const { data: fetchResult, isLoading } = useCoverPlaylistsData(userId);
    const loadMoreMutation = useLoadMoreCoverPlaylistsDataMutation();

    const columnsPlaylists: baseTypes.TCoverPlaylist[][] =
        fetchResult
            ? Array.from(utils.chunked(fetchResult.coverPlaylists, 5))
            : [];

    return (
        <InfinityContent
            isLoading={isLoading}
            hasMore={!!(fetchResult && fetchResult.nextFrom || "")}
            loadMoreMutation={loadMoreMutation}
            loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
        >
            <List>
                {columnsPlaylists.map(playlists => (
                    <HorizantalCoverPlaylists
                        userId={userId}
                        playlists={playlists}
                    />
                ))}
            </List>
        </InfinityContent>
    );
};
