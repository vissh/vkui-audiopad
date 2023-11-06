import { baseEnums, tabTypes } from "@vk-audiopad/common";
import { Tabs, TabsItem } from "@vkontakte/vkui";
import { FC, useEffect } from "react";
import { useAtom, useAtomValue } from "shared/lib/atom";
import { deleteTracksPendingDeletion } from "shared/lib/tracks";
import { currentPlaylistAtom } from "shared/model/storage-atoms";
import { getTabName } from "../lib/utils";
import { selectedTabAtom } from "../model/atom";

export const ContentTabs: FC = () => {
    const currentPlaylist = useAtomValue(currentPlaylistAtom);
    const currentPlaylistExists = !!(currentPlaylist && currentPlaylist.tracks.length > 0);

    return (
        <Tabs mode="accent">
            {currentPlaylistExists && <ContentTabItem tab={baseEnums.EContentTab.CURRENT_PLAYLIST} />}
            <ContentTabItem tab={baseEnums.EContentTab.GENERAL} />
            <ContentTabItem tab={baseEnums.EContentTab.MY_MUSIC} />
            <ContentTabItem tab={baseEnums.EContentTab.EXPLORE} />
        </Tabs>
    );
};

type ContentTabItemProps = {
    tab: tabTypes.TClickableContentTabs;
};

const ContentTabItem: FC<ContentTabItemProps> = ({ tab }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    const title = getTabName({ tab: tab });

    useEffect(() => {
        if (selectedTab) {
            deleteTracksPendingDeletion();
        }
    }, [selectedTab]);

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
