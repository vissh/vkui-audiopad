import { TTrackItem } from "../types/base";
import { EAudioTupleIndex } from "../types/enums";

export const win1251ResponseToUTF8String = async (response: Response): Promise<string> => {
    const contentType = response.headers.get("Content-Type");

    if (contentType && contentType.toLowerCase().includes("charset=windows-1251")) {
        return new TextDecoder("windows-1251").decode(await response.arrayBuffer());
    }

    return await response.text();
};

export const toTracksItems = (playlist: any): TTrackItem[] => {
    const isRadio = playlist.type === "radio";

    return playlist.list.map((trackInfo: Array<any>) => {
        return toTrackItem(trackInfo, isRadio);
    });
};

export const toTrackItem = (trackInfo: Array<any>, isRadio?: boolean): TTrackItem => {
    const hashes = trackInfo[EAudioTupleIndex.HASHES];
    const [addHash, editHash, actionHash, deleteHash, replaceHash, urlHash, restoreHash] = hashes.split('/');
    const mainArtists = trackInfo[EAudioTupleIndex.MAIN_ARTISTS];
    const featArtists = trackInfo[EAudioTupleIndex.FEAT_ARTISTS];
    return {
        id: trackInfo[EAudioTupleIndex.OWNER_ID] + "_" + trackInfo[EAudioTupleIndex.ID],
        accessKey: trackInfo[EAudioTupleIndex.ACCESS_KEY],
        url: isRadio ? trackInfo[EAudioTupleIndex.URL] : "",
        image: trackInfo[EAudioTupleIndex.COVER_URL].split(",")[0],
        artist: decode(trackInfo[EAudioTupleIndex.PERFORMER]),
        mainArtists: mainArtists ? mainArtists : [],
        featArtists: featArtists ? featArtists : [],
        title: decode(trackInfo[EAudioTupleIndex.TITLE]),
        duration: trackInfo[EAudioTupleIndex.DURATION],
        context: trackInfo[EAudioTupleIndex.CONTEXT],
        flags: trackInfo[EAudioTupleIndex.FLAGS],
        trackCode: trackInfo[EAudioTupleIndex.TRACK_CODE],
        addHash: addHash,
        editHash: editHash,
        actionHash: actionHash,
        deleteHash: deleteHash,
        replaceHash: replaceHash,
        urlHash: urlHash,
        restoreHash: restoreHash,
    };
};

export const decode = (value: string): string => {
    let txt = new DOMParser().parseFromString(value, "text/html");
    return txt.documentElement.textContent || "";
};
