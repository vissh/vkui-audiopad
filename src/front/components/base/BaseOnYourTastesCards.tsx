import "@vkontakte/vkui/dist/vkui.css";

import { Card, CardScroll, Text, Title } from "@vkontakte/vkui";
import { FC } from "react";

import { ContentTab, ICoverPlaylist } from "../../../types";
import { useBlockPlaylistActions, useTabActions } from "../../hooks/useActions";

type Props = {
    coverPlaylists: ICoverPlaylist[];
};

export const BaseOnYourTastesCards: FC<Props> = ({ coverPlaylists }) => {
    const { setTab } = useTabActions();
    const { setBlockId } = useBlockPlaylistActions();

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
                        onClick={() => {
                            setBlockId(coverPlaylist);
                            setTab(ContentTab.BLOCK_PLAYLIST);
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
