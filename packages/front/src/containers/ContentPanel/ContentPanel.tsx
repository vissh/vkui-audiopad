import { baseEnums, tabTypes } from "@vk-audiopad/common";
import { Group, Tabs, TabsItem } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom, useAtomValue } from "../../core/atom";
import { currentPlaylistAtom, selectedTabAtom, userIdAtom } from "../../core/atoms/storage";
import { SearchInput } from "../SearchInput";
import { BlockPlaylist } from "./BlockPlaylist/BlockPlaylist";
import { CoverPlaylists } from "./CoverPlaylists/CoverPlaylists";
import { CurrentPlaylist } from "./CurrentPlaylist/CurrentPlaylist";
import { Explore } from "./Explore/Explore";
import { General } from "./General/General";
import { MyMusic } from "./MyMusic/MyMusic";
import { SearchResult } from "./SearchResult/SearchResult";

export const ContentPanel: FC = () => {
    const userId = useAtomValue(userIdAtom);
    const currentPlaylist = useAtomValue(currentPlaylistAtom);
    const selectedTab = useAtomValue(selectedTabAtom);

    const currentPlaylistExists = !!(currentPlaylist && currentPlaylist.tracks.length > 0)

    return (
        <Group>
            <Tabs mode="secondary">
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

            <Group id="tab-content" aria-labelledby="tab" role="tabpanel" mode="plain">
                <SearchInput />
                {selectedTab.tab === baseEnums.EContentTab.CURRENT_PLAYLIST && <CurrentPlaylist />}
                {selectedTab.tab === baseEnums.EContentTab.GENERAL && <General userId={userId} />}
                {selectedTab.tab === baseEnums.EContentTab.MY_MUSIC && <MyMusic userId={userId} />}
                {selectedTab.tab === baseEnums.EContentTab.EXPLORE && <Explore userId={userId} />}
                {selectedTab.tab === baseEnums.EContentTab.SEARCH && <SearchResult userId={userId} selectedTab={selectedTab} />}
                {selectedTab.tab === baseEnums.EContentTab.COVER_PLAYLISTS && <CoverPlaylists userId={userId} />}
                {selectedTab.tab === baseEnums.EContentTab.BLOCK_PLAYLIST && <BlockPlaylist selectedTab={selectedTab} />}
            </Group>

        </Group>
    );
};

type ContentTabItemProps = {
    tab: tabTypes.TSelectedTabClickable;
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
