import { Group, Tabs, TabsItem } from "@vkontakte/vkui";
import { FC } from "react";

import { useTabActions } from "../hooks/useActions";
import { useTypedSelector } from "../hooks/useTypedSelector";
import { ContentTab } from "../types";
import { SearchTracks } from "./base/SearchTracks";
import { GeneralPanel } from "./panels/GeneralPanel";
import { MyMusicPanel } from "./panels/MyMusicPanel";
import { SearchPanel } from "./panels/SearchPanel";


export const ContentPanel: FC = () => {
    const { setTab } = useTabActions();
    const { selectedTab, displayCurrentPlaylistTab } = useTypedSelector(state => state.selectedTab);

    return (
        <Group>
            <Tabs mode="secondary">
                {displayCurrentPlaylistTab && (
                    <TabsItem
                        selected={selectedTab === ContentTab.CURRENT_PLAYLIST}
                        id="tab-current-playlist"
                        aria-controls="tab-content-current-playlist"
                        onClick={() => { setTab(ContentTab.CURRENT_PLAYLIST) }}
                    >
                        Текущий плейлист
                    </TabsItem>
                )}

                <TabsItem
                    selected={selectedTab === ContentTab.GENERAL}
                    id="tab-general"
                    aria-controls="tab-content-general"
                    onClick={() => { setTab(ContentTab.GENERAL) }}
                >
                    Главная
                </TabsItem>

                <TabsItem
                    selected={selectedTab === ContentTab.MY_MUSIC}
                    id="tab-my-music"
                    aria-controls="tab-content-my-music"
                    onClick={() => { setTab(ContentTab.MY_MUSIC) }}
                >
                    Моя музыка
                </TabsItem>

                <TabsItem
                    selected={selectedTab === ContentTab.EXPLORE}
                    id="tab-explore"
                    aria-controls="tab-content-explore"
                    onClick={() => { setTab(ContentTab.EXPLORE) }}
                >
                    Обзор
                </TabsItem>

            </Tabs>

            <Group
                id="tab-content"
                aria-labelledby="tab"
                role="tabpanel"
                mode="plain"
            >
                <SearchTracks />
                {selectedTab === ContentTab.GENERAL && <GeneralPanel />}
                {selectedTab === ContentTab.MY_MUSIC && <MyMusicPanel />}
                {selectedTab === ContentTab.SEARCH && <SearchPanel />}
            </Group>

        </Group>
    );
};
