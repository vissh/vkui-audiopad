import { baseEnums, tabTypes } from "@vk-audiopad/common";
import { Tabs, TabsItem } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom, useAtomValue } from "../../core/atom";
import { currentPlaylistAtom, selectedTabAtom } from "../../core/atoms";

export const ContentTabs: FC = () => {
    const currentPlaylist = useAtomValue(currentPlaylistAtom);

    const currentPlaylistExists = !!(currentPlaylist && currentPlaylist.tracks.length > 0)

    return (
        <Tabs mode="accent">
            {currentPlaylistExists && (
                <ContentTabItem
                    tab={baseEnums.EContentTab.CURRENT_PLAYLIST}
                    title="Текущий плейлист"
                />
            )}
            <ContentTabItem
                tab={baseEnums.EContentTab.GENERAL}
                title="Главная"
            />
            <ContentTabItem
                tab={baseEnums.EContentTab.MY_MUSIC}
                title="Моя музыка"
            />
            <ContentTabItem
                tab={baseEnums.EContentTab.EXPLORE}
                title="Обзор"
            />
        </Tabs>
    );
};

type ContentTabItemProps = {
    tab: tabTypes.TClickableContentTabs;
    title: string;
};

const ContentTabItem: FC<ContentTabItemProps> = ({ tab, title }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    return (
        <TabsItem
            selected={selectedTab.tab === tab}
            id={"tab-" + tab}
            aria-controls={"tab-content-" + tab}
            onClick={() => setSelectedTab({ tab: tab })}
        >
            {title}
        </TabsItem>
    );
};
