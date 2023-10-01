import { baseEnums, baseTypes, tabTypes, vkFetchUtils } from "@vk-audiopad/common";
import { TCoverPlaylist } from "shared/types";

export const toTitlePlaylist = (playlist: any): baseTypes.TTitlePlaylist => {
    const isRadio = playlist.type === "radio";
    return {
        id: String(playlist.id),
        ownerId: String(playlist.ownerId),
        accessHash: playlist.accessHash,
        blockId: playlist.blockId,
        nextOffset: playlist.nextOffset,
        hasMore: !!(playlist.hasMore && playlist.nextOffset),
        title: isRadio ? "Радиостанции" : getText(playlist.title),
        tracks: vkFetchUtils.toTracksItems(playlist),
        isRadio: isRadio,
        followHash: playlist.followHash,
        isFollowed: playlist.isFollowed,
    };
};

export const toCoverPlaylist = (playlist: any): TCoverPlaylist => {
    const gridCoverUrls: string[] = [];

    if (!playlist.coverUrl && playlist.gridCovers) {
        const htmlElement = document.createElement("html");
        htmlElement.innerHTML = playlist.gridCovers;
        htmlElement.querySelectorAll('[style^="background-image:url"]').forEach(el => {
            const url = (el as HTMLInputElement).style.backgroundImage.slice(4, -1).replace(/"/g, "");
            url && gridCoverUrls.push(url);
        });
    }

    const coverUrl = playlist.coverUrl || (gridCoverUrls.length && gridCoverUrls[0]) || "";
    !gridCoverUrls.length && coverUrl && gridCoverUrls.push(coverUrl);

    return {
        ...toTitlePlaylist(playlist),
        coverUrl: coverUrl,
        gridCoverUrls: gridCoverUrls,
        authorLine: getText(playlist.authorLine),
        authorName: getText(playlist.authorName),
        infoLine: playlist.infoLine,
    };
};

const getText = (str: string) => {
    if (str.startsWith("<")) {
        const htmlElement = document.createElement("html");
        htmlElement.innerHTML = str;
        str = htmlElement.innerText;
    }
    return vkFetchUtils.decode(str);
};

export const getTextFromHtmlElements = (elements: HTMLCollectionOf<Element>): string => {
    if (!elements.length) {
        return "";
    }

    const element = elements[0];
    if (!element.childNodes.length) {
        return (element.textContent || "").trim();
    }

    return Array
        .from(element.childNodes)
        .map(x => x.textContent)
        .filter(x => !!x)
        .join(" ")
        .trim();
};

export const assertUnreachable = (value: never): never => {
    throw new Error("Statement should be unreachable");
};

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
        case baseEnums.EContentTab.COVER_PLAYLISTS:
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
