import { storage, types } from "@vk-audiopad/common";
import { Group, Tabs, TabsItem } from "@vkontakte/vkui";
import { FC } from "react";
import { CONTENT_ELEMENT_ID } from "../constants";
import { useTypedSelector } from "../hooks/useTypedSelector";
import { SearchTracks } from "./base/SearchTracks";
import { BlockPlaylistPanel } from "./panels/BlockPlaylistPanel";
import { CoverPlaylistsPanel } from "./panels/CoverPlaylistsPanel";
import { CurrentPlaylistPanel } from "./panels/CurrentPlaylistPanel";
import { ExplorePanel } from "./panels/ExplorePanel";
import { GeneralPanel } from "./panels/GeneralPanel";
import { MyMusicPanel } from "./panels/MyMusicPanel";
import { SearchPanel } from "./panels/SearchPanel";

export const ContentPanel: FC = () => {
    const { currentPlaylistExists, selectedTab } = useTypedSelector(state => state.application);

    return (
        <Group id={CONTENT_ELEMENT_ID}>
            <Tabs mode="secondary">
                {currentPlaylistExists && (
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
                {selectedTab.tab === types.ContentTab.CURRENT_PLAYLIST && <CurrentPlaylistPanel />}
                {selectedTab.tab === types.ContentTab.GENERAL && <GeneralPanel />}
                {selectedTab.tab === types.ContentTab.MY_MUSIC && <MyMusicPanel />}
                {selectedTab.tab === types.ContentTab.EXPLORE && <ExplorePanel />}
                {selectedTab.tab === types.ContentTab.SEARCH && <SearchPanel />}
                {selectedTab.tab === types.ContentTab.BLOCK_PLAYLIST && <BlockPlaylistPanel />}
                {selectedTab.tab === types.ContentTab.COVER_PLAYLISTS && <CoverPlaylistsPanel />}
            </Group>

        </Group>
    );
};

type ContentTabItemProps = {
    tab: types.TypeSelectedTabClickable;
    title: string;
}

const ContentTabItem: FC<ContentTabItemProps> = ({ tab, title }) => {
    const { selectedTab } = useTypedSelector(state => state.application);

    const onClick = async () => {
        await storage.set({ selectedTab: { tab: tab } });
    };

    return (
        <TabsItem
            selected={selectedTab.tab === tab}
            id={"tab-" + tab}
            aria-controls={"tab-content-" + tab}
            onClick={onClick}
        >
            {title}
        </TabsItem>
    );
};
