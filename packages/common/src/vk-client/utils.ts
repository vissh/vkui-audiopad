import { decode } from "html-entities";
import { TypeCoverPlaylist, TypeTitlePlaylist, TypeTrackItem } from "../types";
import { EAudioTupleIndex } from "./enums";

export const toTitlePlaylist = (playlist: any): TypeTitlePlaylist => {
    const isRadio = playlist.type === "radio";
    return {
        id: String(playlist.id),
        ownerId: String(playlist.ownerId),
        accessHash: playlist.accessHash,
        blockId: playlist.blockId,
        nextOffset: playlist.nextOffset,
        hasMore: !!(playlist.hasMore && playlist.nextOffset),
        title: isRadio ? "Радиостанции" : getText(playlist.title),
        tracks: toTracksItems(playlist),
        isRadio: isRadio,
    };
};

export const toCoverPlaylist = (playlist: any): TypeCoverPlaylist => {
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
    };
};

export const toTracksItems = (playlist: any): TypeTrackItem[] => {
    const isRadio = playlist.type === "radio";

    return playlist.list.map((trackInfo: Array<any>) => {
        return toTrackItem(trackInfo, isRadio);
    });
};

export const toTrackItem = (trackInfo: Array<any>, isRadio?: boolean): TypeTrackItem => {
    const hashes = trackInfo[EAudioTupleIndex.HASHES];
    const [addHash, editHash, actionHash, deleteHash, replaceHash, urlHash, restoreHash] = hashes.split('/');
    return {
        id: trackInfo[EAudioTupleIndex.OWNER_ID] + "_" + trackInfo[EAudioTupleIndex.ID],
        accessKey: trackInfo[EAudioTupleIndex.ACCESS_KEY],
        url: isRadio ? trackInfo[EAudioTupleIndex.URL] : "",
        image: trackInfo[EAudioTupleIndex.COVER_URL].split(",")[0],
        artist: decode(trackInfo[EAudioTupleIndex.PERFORMER]),
        title: decode(trackInfo[EAudioTupleIndex.TITLE]),
        duration: trackInfo[EAudioTupleIndex.DURATION],
        context: trackInfo[EAudioTupleIndex.CONTEXT],
        flags: trackInfo[EAudioTupleIndex.FLAGS],
        addHash: addHash,
        editHash: editHash,
        actionHash: actionHash,
        deleteHash: deleteHash,
        replaceHash: replaceHash,
        urlHash: urlHash,
        restoreHash: restoreHash,
    };
};

const getText = (str: string) => {
    if (str.startsWith("<")) {
        const hmtlElement = document.createElement("html");
        hmtlElement.innerHTML = str;
        str = hmtlElement.innerText;
    }
    return decode(str);
};
