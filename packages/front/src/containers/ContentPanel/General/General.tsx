import { Group, Header } from "@vkontakte/vkui";
import { FC } from "react";
import { BaseOnYourTastesCards } from "../../../components/BaseOnYourTastesCards";
import { Content } from "../../../components/Content";
import { HorizontalTitleCoverPlaylists } from "../../../components/HorizontalTitleCoverPlaylists";
import { HorizantalTitleTracks } from "../../../components/HorizontalTitleTracks";
import { Navigation } from "../Navigation";
import { useGeneralData } from "./hooks";

type Props = {
    userId: string;
};

export const General: FC<Props> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useGeneralData(userId);

    return (
        <Content loading={isLoading} error={error}>
            <Group>
                <Navigation />
                {fetchResult && fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                    <HorizantalTitleTracks userId={userId} playlist={fetchResult.playlist} />
                )}
            </Group>

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
