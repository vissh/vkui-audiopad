import { storage, types } from "@vk-audiopad/common";
import { Card, CardScroll, Text, Title } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import { FC } from "react";
import { useTypedSelector } from "../../hooks/useTypedSelector";

type Props = {
    coverPlaylists: types.TypeCoverPlaylist[];
};

export const BaseOnYourTastesCards: FC<Props> = ({ coverPlaylists }) => {
    const { userId } = useTypedSelector(state => state.application);

    return (
        <CardScroll size="s">
            <div style={{ display: "flex" }}>
                {coverPlaylists.map(coverPlaylist => (
                    <Card
                        style={{
                            backgroundImage: "url(" + coverPlaylist.coverUrl + ")",
                            backgroundSize: "165px 200px",
                            width: "165px",
                            height: "200px",
                            cursor: "pointer",
                        }}
                        onClick={async () => {
                            await storage.set({
                                selectedTab: {
                                    tab: types.ContentTab.BLOCK_PLAYLIST,
                                    fromId: userId,
                                    playlist: coverPlaylist,
                                }
                            });
                        }}
                    >
                        <Title
                            style={{
                                marginBottom: 12,
                                marginTop: 20,
                                textAlign: "center",
                                color: "white",
                            }}
                            level="1"
                            weight="1"
                        >
                            {coverPlaylist.title}
                        </Title>
                        <Text
                            style={{
                                marginBottom: 48,
                                textAlign: "center",
                                color: "white",
                            }}
                        >
                            {coverPlaylist.authorLine}
                        </Text>
                    </Card>
                ))}
            </div>
        </CardScroll>
    );
};
