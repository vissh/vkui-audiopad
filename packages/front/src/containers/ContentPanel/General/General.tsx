import { Group, Header } from "@vkontakte/vkui";
import { FC } from "react";
import { BaseOnYourTastesCards } from "../../../components/BaseOnYourTastesCards";
import { Content } from "../../../components/Content";
import { HorizantalTitleTracks } from "../../../components/HorizontalTitleTracks";
import { useGeneralData } from "./hooks";

type Props = {
    userId: string;
};

export const General: FC<Props> = ({ userId }) => {
    const { data: fetchResult, isLoading } = useGeneralData(userId);

    return (
        <Content loading={isLoading} error={null}>
            {fetchResult &&
                <>
                    {fetchResult.playlist && fetchResult.playlist.tracks.length > 0 && (
                        <HorizantalTitleTracks userId={userId} playlist={fetchResult.playlist} />
                    )}

                    {fetchResult.baseOnYourTastes && fetchResult.baseOnYourTastes.length > 0 && (
                        <Group
                            mode="plain"
                            header={
                                <Header mode="secondary">
                                    Собрано алгоритмами
                                </Header>
                            }
                        >
                            <BaseOnYourTastesCards
                                userId={userId}
                                coverPlaylists={fetchResult.baseOnYourTastes}
                            />
                        </Group>
                    )}
                </>
            }
        </Content >
    );
};
