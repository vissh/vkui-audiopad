import { Group, Header } from "@vkontakte/vkui";
import { FC } from "react";
import { BaseOnYourTastesCards } from "../../../components/BaseOnYourTastesCards";
import { Content } from "../../../components/Content";
import { HorizontalTitleCoverPlaylists } from "../../../components/HorizontalTitleCoverPlaylists";
import { HorizantalTitleTracks } from "../../../components/HorizontalTitleTracks";
import { SkeletonHorizontalCards } from "../../../skeletons/SkeletonHorizontalCards";
import { SkeletonHorizontalCoverPlaylists } from "../../../skeletons/SkeletonHorizontalCoverPlaylists";
import { SkeletonHorizontalTitleTracks } from "../../../skeletons/SkeletonHorizontalTitleTracks";
import { Navigation } from "../Navigation";
import { useGeneralData } from "./hooks";

type Props = {
    userId: string;
};

export const General: FC<Props> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useGeneralData(userId);

    return (
        <Content error={error}>
            <Group>
                <Navigation />

                {isLoading && <SkeletonHorizontalTitleTracks />}

                {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                    <HorizantalTitleTracks userId={userId} playlist={fetchResult.playlist} />
                )}
            </Group>

            {isLoading && (
                <>
                    <Group><SkeletonHorizontalCards /></Group>
                    <Group><SkeletonHorizontalCoverPlaylists /></Group>
                </>
            )}

            {fetchResult && fetchResult.baseOnYourTastes.length > 0 && (
                <Group
                    header={<Header>Собрано алгоритмами</Header>}
                >
                    <BaseOnYourTastesCards
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
