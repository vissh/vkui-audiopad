import { Group, Tabs, TabsItem } from "@vkontakte/vkui";
import { FC, useState } from "react";

import { SearchTracks } from "./base/SearchTracks";
import { MyMusicPanel } from "./panels/MyMusicPanel";

enum ContentTab {
    CURRENT_PLAYLIST = "current-playlist",
    GENERAL = "general",
    MY_MUSIC = "my-music",
    EXPLORE = "explore",
    SEARCH = "search",
};

export const ContentPanel: FC = () => {
    const [selected, setSelected] = useState("my-music");

    return (
        <Group>
            <Tabs>
                <TabsItem
                    selected={selected === ContentTab.CURRENT_PLAYLIST}
                    id="tab-current-playlist"
                    aria-controls="tab-content-current-playlist"
                    onClick={() => {
                        setSelected(ContentTab.CURRENT_PLAYLIST);
                    }}
                >
                    Текущий плейлист
                </TabsItem>

                <TabsItem
                    selected={selected === ContentTab.GENERAL}
                    id="tab-general"
                    aria-controls="tab-content-general"
                    onClick={() => {
                        setSelected(ContentTab.GENERAL);
                    }}
                >
                    Главная
                </TabsItem>

                <TabsItem
                    selected={selected === ContentTab.MY_MUSIC}
                    id="tab-my-music"
                    aria-controls="tab-content-my-music"
                    onClick={() => {
                        setSelected(ContentTab.MY_MUSIC);
                    }}
                >
                    Моя музыка
                </TabsItem>

                <TabsItem
                    selected={selected === ContentTab.EXPLORE}
                    id="tab-explore"
                    aria-controls="tab-content-explore"
                    onClick={() => {
                        setSelected(ContentTab.EXPLORE);
                    }}
                >
                    Обзор
                </TabsItem>

            </Tabs>

            <Group
                id="tab-content-my-music"
                aria-labelledby="tab-my-music"
                role="tabpanel"
                mode="plain"
                hidden={selected !== ContentTab.MY_MUSIC}
            >
                <SearchTracks />
                <MyMusicPanel />
            </Group>

            <Group
                id="tab-content-search"
                aria-labelledby="tab-search"
                role="tabpanel"
                mode="plain"
                hidden={selected !== ContentTab.SEARCH}
            >
            </Group>
        </Group>
    );
};
