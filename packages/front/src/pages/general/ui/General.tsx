import { Group, Header } from "@vkontakte/vkui";
import { FC } from "react";
import { Content } from "shared/ui/components";
import {
    SkeletonHorizontalCards,
    SkeletonHorizontalCoverPlaylists,
    SkeletonHorizontalTitleTracks,
} from "shared/ui/skeletons";
import { NavigationWithSearch } from "widgets/navigation";
import { HorizontalTitleCoverPlaylists, HorizontalTitleTracks } from "widgets/playlists";
import { useGeneralData } from "../model/hooks";
import { HorizontalCardPlaylists } from "./HorizontalCardPlaylists";

type GeneralProps = {
    userId: string;
};

export const General: FC<GeneralProps> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useGeneralData(userId);

    return (
        <Content error={error}>
            <Group>
                <NavigationWithSearch />

                {isLoading && <SkeletonHorizontalTitleTracks />}

                {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                    <HorizontalTitleTracks
                        userId={userId}
                        playlist={fetchResult.playlist}
                    />
                )}
            </Group>

            {isLoading && (
                <>
                    <Group>
                        <SkeletonHorizontalCards />
                    </Group>
                    <Group>
                        <SkeletonHorizontalCoverPlaylists />
                    </Group>
                </>
            )}

            {fetchResult && fetchResult.baseOnYourTastes.length > 0 && (
                <Group header={<Header>Собрано алгоритмами</Header>}>
                    <HorizontalCardPlaylists
                        userId={userId}
                        coverPlaylists={fetchResult.baseOnYourTastes}
                    />
                </Group>
            )}

            {fetchResult && fetchResult.vkMusic.length > 0 && (
                <Group>
                    <HorizontalTitleCoverPlaylists
                        title="Собрано редакцией"
                        userId={userId}
                        playlists={fetchResult.vkMusic}
                        showAllLink={`/audios${userId}?block=playlists&section=general`}
                        showMore={true}
                    />
                </Group>
            )}
        </Content>
    );
};
