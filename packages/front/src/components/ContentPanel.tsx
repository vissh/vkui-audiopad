import { types } from "@vk-audiopad/common";
import { Group, Tabs, TabsItem } from "@vkontakte/vkui";
import { FC } from "react";

import { useTabActions } from "../hooks/useActions";
import { useTypedSelector } from "../hooks/useTypedSelector";
import { SearchTracks } from "./base/SearchTracks";
import { BlockPlaylistPanel } from "./panels/BlockPlaylistPanel";
import { ExplorePanel } from "./panels/ExplorePanel";
import { GeneralPanel } from "./panels/GeneralPanel";
import { MyMusicPanel } from "./panels/MyMusicPanel";
import { SearchPanel } from "./panels/SearchPanel";


export const ContentPanel: FC = () => {
    const { selectedTab, displayCurrentPlaylistTab } = useTypedSelector(state => state.selectedTab);

    return (
        <Group>
            <Tabs mode="secondary">
                {displayCurrentPlaylistTab && (
                    <ContentTabItem
                        tab={types.ContentTab.CURRENT_PLAYLIST}
                        title="Текущий плейлист"
                    />
                )}
                <ContentTabItem
                    tab={types.ContentTab.GENERAL}
                    title="Главная"
                />
                <ContentTabItem
                    tab={types.ContentTab.MY_MUSIC}
                    title="Моя музыка"
                />
                <ContentTabItem
                    tab={types.ContentTab.EXPLORE}
                    title="Обзор"
                />
            </Tabs>

            <Group id="tab-content" aria-labelledby="tab" role="tabpanel" mode="plain">
                <SearchTracks />
                {selectedTab === types.ContentTab.GENERAL && <GeneralPanel />}
                {selectedTab === types.ContentTab.MY_MUSIC && <MyMusicPanel />}
                {selectedTab === types.ContentTab.EXPLORE && <ExplorePanel />}
                {selectedTab === types.ContentTab.SEARCH && <SearchPanel />}
                {selectedTab === types.ContentTab.BLOCK_PLAYLIST && <BlockPlaylistPanel />}
            </Group>

        </Group>
    );
};

type ContentTabItemProps = {
    tab: types.ContentTab;
    title: string;
}

const ContentTabItem: FC<ContentTabItemProps> = ({ tab, title }) => {
    const { setTab } = useTabActions();
    const { selectedTab } = useTypedSelector(state => state.selectedTab);

    return (
        <TabsItem
            selected={selectedTab === tab}
            id={"tab-" + tab}
            aria-controls={"tab-content-" + tab}
            onClick={() => { setTab(tab) }}
        >
            {title}
        </TabsItem>
    );
};
