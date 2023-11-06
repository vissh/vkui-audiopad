import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "shared/lib/atom";
import { newHistory } from "../lib/utils";
import { selectedTabAtom } from "./atom";

export const useSetSearch = () => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    return (value: string) => {
        setSelectedTab({
            tab: baseEnums.EContentTab.SEARCH,
            value: value,
        });
    }
}

export const useSetPlaylist = () => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    return (userId: string, playlist: baseTypes.TTitlePlaylist) => {
        setSelectedTab({
            tab: baseEnums.EContentTab.BLOCK_PLAYLIST,
            fromId: userId,
            playlist: playlist,
            history: newHistory(selectedTab),
        });
    }
}


export const useSetPlaylistWithCleanHistory = () => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    return (userId: string, playlist: baseTypes.TTitlePlaylist) => {
        setSelectedTab({
            tab: baseEnums.EContentTab.BLOCK_PLAYLIST,
            fromId: userId,
            playlist: playlist,
            history: [{ tab: baseEnums.EContentTab.GENERAL }],
        });
    }
}


export const useSetArtist = () => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    return (artist: baseTypes.TArtist) => {
        setSelectedTab({
            tab: baseEnums.EContentTab.ARTIST,
            id: artist.id,
            name: artist.name,
            history: [{ tab: baseEnums.EContentTab.GENERAL }],
        });
    }
}

export const useSetAlbums = () => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    return (title: string, showAllLink: string) => {
        setSelectedTab({
            tab: baseEnums.EContentTab.ALBUMS,
            title: title,
            showAllLink: showAllLink,
            history: newHistory(selectedTab),
        });
    }
}


export const useOnOpenSearchTab = (callback: (value: string) => void) => {
    const selectedTab = useAtomValue(selectedTabAtom);

    useEffect(() => {
        if (selectedTab.tab === baseEnums.EContentTab.SEARCH) {
            callback(selectedTab.value);
        }
    }, [selectedTab]);
}

export const useOnLeaveSearchTab = (callback: () => void) => {
    const selectedTab = useAtomValue(selectedTabAtom);

    useEffect(() => {
        if (selectedTab.tab !== baseEnums.EContentTab.SEARCH) {
            callback();
        }
    }, [selectedTab]);
}
