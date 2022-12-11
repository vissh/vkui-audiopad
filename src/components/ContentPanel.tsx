import { Group, Tabs, TabsItem } from "@vkontakte/vkui";
import { FC } from "react";

import { useTabActions } from "../hooks/useActions";
import { useTypedSelector } from "../hooks/useTypedSelector";
import { ContentTab } from "../types";
import { SearchTracks } from "./base/SearchTracks";
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
                        tab={ContentTab.CURRENT_PLAYLIST}
                        title="Текущий плейлист"
                    />
                )}
                <ContentTabItem
                    tab={ContentTab.GENERAL}
                    title="Главная"
                />
                <ContentTabItem
                    tab={ContentTab.MY_MUSIC}
                    title="Моя музыка"
                />
                <ContentTabItem
                    tab={ContentTab.EXPLORE}
                    title="Обзор"
                />
            </Tabs>

            <Group id="tab-content" aria-labelledby="tab" role="tabpanel" mode="plain">
                <SearchTracks />
                {selectedTab === ContentTab.GENERAL && <GeneralPanel />}
                {selectedTab === ContentTab.MY_MUSIC && <MyMusicPanel />}
                {selectedTab === ContentTab.EXPLORE && <ExplorePanel />}
                {selectedTab === ContentTab.SEARCH && <SearchPanel />}
            </Group>

        </Group>
    );
};

type ContentTabItemProps = {
    tab: ContentTab;
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
