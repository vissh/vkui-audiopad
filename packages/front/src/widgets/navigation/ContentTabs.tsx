import { baseEnums, tabTypes } from "@vk-audiopad/common";
import { Tabs, TabsItem } from "@vkontakte/vkui";
import { useAtom, useAtomValue } from "shared/lib/atom";
import { FC } from "react";
import { currentPlaylistAtom, selectedTabAtom } from "shared/appAtoms";
import { sendEventOpenTab } from "shared/lib/analytics";

export const ContentTabs: FC = () => {
    const currentPlaylist = useAtomValue(currentPlaylistAtom);

    const currentPlaylistExists = !!(currentPlaylist && currentPlaylist.tracks.length > 0);

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

    const openTab = () => {
        setSelectedTab({ tab: tab });
        sendEventOpenTab(tab);
    };

    return (
        <TabsItem
            selected={selectedTab.tab === tab}
            id={"tab-" + tab}
            aria-controls={"tab-content-" + tab}
            onClick={openTab}
        >
            {title}
        </TabsItem>
    );
};
