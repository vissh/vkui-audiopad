import { baseEnums } from "@vk-audiopad/common";
import { Card, CardScroll, Text, Title } from "@vkontakte/vkui";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { useAtom } from "shared/lib/atom";
import { newHistory } from "shared/lib/utils";
import { TCoverPlaylist } from "shared/types";

type HorizontalCardPlaylistsProps = {
    userId: string;
    coverPlaylists: TCoverPlaylist[];
};

export const HorizontalCardPlaylists: FC<HorizontalCardPlaylistsProps> = ({ userId, coverPlaylists }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    return (
        <CardScroll size="s">
            <div style={{ display: "flex" }}>
                {coverPlaylists.map((coverPlaylist) => (
                    <Card
                        style={{
                            backgroundImage: "url(" + coverPlaylist.coverUrl + ")",
                            backgroundSize: "165px 200px",
                            width: "165px",
                            height: "200px",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            setSelectedTab({
                                tab: baseEnums.EContentTab.BLOCK_PLAYLIST,
                                fromId: userId,
                                playlist: coverPlaylist,
                                history: newHistory(selectedTab),
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
