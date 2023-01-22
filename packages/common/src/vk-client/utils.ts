import { decode } from "html-entities";

import { ICoverPlaylist, ITitlePlaylist, ITrackItem } from "../types";
import { AUDIO_ITEM_AVATAR, AUDIO_ITEM_INDEX_DURATION, AUDIO_ITEM_INDEX_ID, AUDIO_ITEM_INDEX_PERFORMER, AUDIO_ITEM_INDEX_TITLE } from "./constants";

export function toTracksItems(arr: any[]): ITrackItem[] {
    return arr.map(trackInfo => {
        return {
            id: trackInfo[AUDIO_ITEM_INDEX_ID],
            image: trackInfo[AUDIO_ITEM_AVATAR].split(",")[0],
            artist: decode(trackInfo[AUDIO_ITEM_INDEX_TITLE]),
            title: decode(trackInfo[AUDIO_ITEM_INDEX_PERFORMER]),
            duration: trackInfo[AUDIO_ITEM_INDEX_DURATION],
        }
    });
}

export function toTitlePlaylist(playlist: any): ITitlePlaylist {
    return {
        id: String(playlist.id),
        ownerId: String(playlist.ownerId),
        accessHash: playlist.accessHash,
        blockId: playlist.blockId,
        nextOffset: playlist.nextOffset,
        hasMore: playlist.hasMore,
        title: getText(playlist.title),
        tracks: toTracksItems(playlist.list),
    }
}

export function toCoverPlaylist(playlist: any): ICoverPlaylist {
    const gridCoverUrls: string[] = [];

    if (!playlist.coverUrl && playlist.gridCovers) {
        const hmtlElement = document.createElement("html");
        hmtlElement.innerHTML = playlist.gridCovers;
        hmtlElement.querySelectorAll('[style^="background-image:url"]').forEach(el => {
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
    }
}

export function getText(str: string) {
    if (str.startsWith("<")) {
        const hmtlElement = document.createElement("html");
        hmtlElement.innerHTML = str;
        str = hmtlElement.innerText;
    }
    return decode(str);
}
