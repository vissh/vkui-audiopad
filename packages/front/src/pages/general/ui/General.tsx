import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { Content } from "shared/ui/content";
import { AlbumGallery } from "widgets/album-gallery";
import { CardGallery } from "widgets/card-gallery";
import { NavigationWithSearch } from "widgets/navigation";
import { TrackGallery } from "widgets/track-gallery";
import { useGeneralData } from "../model/hooks";

type GeneralProps = {
    userId: string;
};

export const General: FC<GeneralProps> = ({ userId }) => {
    const { data: fetchResult, isLoading, error } = useGeneralData(userId);

    return (
        <Content error={error}>
            <Group>
                <NavigationWithSearch />

                <TrackGallery
                    mode="plain"
                    isLoading={isLoading}
                    userId={userId}
                    playlist={fetchResult?.playlist}
                />
            </Group>

            <CardGallery
                isLoading={isLoading}
                title="Собрано алгоритмами"
                userId={userId}
                albums={fetchResult?.baseOnYourTastes}
            />

            <AlbumGallery
                mode="card"
                isLoading={isLoading}
                title="Собрано редакцией"
                userId={userId}
                albums={fetchResult?.vkMusic}
                showAllLink={`/audios${userId}?block=playlists&section=general`}
            />
        </Content>
    );
};
