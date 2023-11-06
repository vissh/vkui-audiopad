import { baseEnums, tabTypes } from "@vk-audiopad/common";
import { assertUnreachable } from "shared/lib/utils";

export const getTabName = (tab: tabTypes.TSelectedTabs) => {
    switch (tab.tab) {
        case baseEnums.EContentTab.UNKNOWN:
            return "UNKNOWN";
        case baseEnums.EContentTab.CURRENT_PLAYLIST:
            return "Текущий плейлист";
        case baseEnums.EContentTab.GENERAL:
            return "Главная";
        case baseEnums.EContentTab.MY_MUSIC:
            return "Моя музыка";
        case baseEnums.EContentTab.EXPLORE:
            return "Обзор";
        case baseEnums.EContentTab.SEARCH:
            return "Результаты поиска";
        case baseEnums.EContentTab.BLOCK_PLAYLIST:
            return tab.playlist.title;
        case baseEnums.EContentTab.ALBUMS:
            return tab.title;
        case baseEnums.EContentTab.ARTIST:
            return tab.name;
        default:
            return assertUnreachable(tab);
    }
};

export const newHistory = (tab: tabTypes.TSelectedTabs): tabTypes.TSelectedTabs[] => {
    return tabTypes.isTabWithHistory(tab) ? [...tab.history, tab] : [tab];
};
