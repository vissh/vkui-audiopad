import { Group, Tabs, TabsItem } from "@vkontakte/vkui";
import React, { FC, useState } from "react";

import { MyMusicPanel } from "./panels/MyMusicPanel";

enum ContentTab {
    GENERAL = "general",
    MY_MUSIC = "my-music",
    SEARCH = "search",
};

export const ContentPanel: FC = () => {
    const [selected, setSelected] = useState("my-music");

    return (
        <React.Fragment>
            <Tabs>

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

            </Tabs>

            <Group
                id="tab-content-my-music"
                aria-labelledby="tab-my-music"
                role="tabpanel"
                mode="plain"
                hidden={selected !== ContentTab.MY_MUSIC}
            >
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
        </React.Fragment>
    );
};
