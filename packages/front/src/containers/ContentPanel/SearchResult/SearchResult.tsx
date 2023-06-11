import { tabTypes } from "@vk-audiopad/common";
import { FC } from "react";
import { Content } from "../../../components/Content";
import { HorizontalTitleCoverPlaylists } from "../../../components/HorizontalTitleCoverPlaylists";
import { HorizantalTitleTracks } from "../../../components/HorizontalTitleTracks";
import { useSearchData } from "./hooks";

type Props = {
    userId: string;
    selectedTab: tabTypes.TSelectedTabSearch;
};

export const SearchResult: FC<Props> = ({ userId, selectedTab }) => {
    const { data: fetchResult, isLoading } = useSearchData(userId, selectedTab.value);

    return (
        <Content loading={isLoading} error={null}>
            {fetchResult &&
                <>
                    {fetchResult.trackPlaylists.length > 0 && (
                        fetchResult.trackPlaylists.map((playlist) => <HorizantalTitleTracks userId={userId} playlist={playlist} />)
                    )}

                    {fetchResult.officialAlbums.length > 0 && (
                        <HorizontalTitleCoverPlaylists
                            userId={userId}
                            title={"Альбомы"}
                            playlists={fetchResult.officialAlbums}
                        />
                    )}

                    {fetchResult.otherPlaylists.length > 0 && (
                        <HorizontalTitleCoverPlaylists
                            userId={userId}
                            title={"Плейлисты"}
                            playlists={fetchResult.otherPlaylists} />
                    )}
                </>
            }
        </Content>
    );
};
