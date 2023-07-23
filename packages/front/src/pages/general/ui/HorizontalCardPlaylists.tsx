import { baseEnums } from "@vk-audiopad/common";
import { Card, CardScroll, Text, Title } from "@vkontakte/vkui";
import { useSetAtom } from "shared/lib/atom";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { TCoverPlaylist } from "shared/types";

type HorizontalCardPlaylistsProps = {
    userId: string;
    coverPlaylists: TCoverPlaylist[];
};

export const HorizontalCardPlaylists: FC<HorizontalCardPlaylistsProps> = ({ userId, coverPlaylists }) => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

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
