import { Group, Tabs, TabsItem } from "@vkontakte/vkui";
import { FC } from "react";

import { useTabActions } from "../hooks/useActions";
import { useTypedSelector } from "../hooks/useTypedSelector";
import { ContentTab } from "../types";
import { SearchTracks } from "./base/SearchTracks";
import { GeneralPanel } from "./panels/GeneralPanel";
import { MyMusicPanel } from "./panels/MyMusicPanel";


export const ContentPanel: FC = () => {
    const { setTab } = useTabActions();
    const { activeTab } = useTypedSelector(state => state.activetab);

    return (
        <Group>
            <Tabs>
                {/* <TabsItem
                    selected={selected === ContentTab.CURRENT_PLAYLIST}
                    id="tab-current-playlist"
                    aria-controls="tab-content-current-playlist"
                    onClick={() => { setSelected(ContentTab.CURRENT_PLAYLIST) }}
                >
                    Текущий плейлист
                </TabsItem> */}

                <TabsItem
                    selected={activeTab === ContentTab.GENERAL}
                    id="tab-general"
                    aria-controls="tab-content-general"
                    onClick={() => { setTab(ContentTab.GENERAL) }}
                >
                    Главная
                </TabsItem>

                <TabsItem
                    selected={activeTab === ContentTab.MY_MUSIC}
                    id="tab-my-music"
                    aria-controls="tab-content-my-music"
                    onClick={() => { setTab(ContentTab.MY_MUSIC) }}
                >
                    Моя музыка
                </TabsItem>

                <TabsItem
                    selected={activeTab === ContentTab.EXPLORE}
                    id="tab-explore"
                    aria-controls="tab-content-explore"
                    onClick={() => { setTab(ContentTab.EXPLORE) }}
                >
                    Обзор
                </TabsItem>

            </Tabs>

            <Group
                id="tab-content-general"
                aria-labelledby="tab-general"
                role="tabpanel"
                mode="plain"
                hidden={activeTab !== ContentTab.GENERAL}
            >
                <SearchTracks />
                <GeneralPanel />
            </Group>

            <Group
                id="tab-content-my-music"
                aria-labelledby="tab-my-music"
                role="tabpanel"
                mode="plain"
                hidden={activeTab !== ContentTab.MY_MUSIC}
            >
                <SearchTracks />
                <MyMusicPanel />
            </Group>

        </Group>
    );
};
