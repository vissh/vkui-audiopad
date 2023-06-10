import { ErrorObject } from "serialize-error";

export type TWebTokenError = {
    type: "unauthorized" | "exception";
    serializedError: ErrorObject | null;
};

export type TWebToken = {
    userId: string;
    accessToken: string;
    expires: number;
    logoutHash: string;
    error: TWebTokenError | null;
};

export type TTrackItem = {
    id: string;
    accessKey: string;
    url: string;
    image: string;
    artist: string;
    title: string;
    duration: number;
    context: string;
    flags: number;
    trackCode: string;
    addHash: string;
    editHash: string;
    actionHash: string;
    deleteHash: string;
    replaceHash: string;
    urlHash: string;
    restoreHash: string;
};

export type TControl = {
    played: boolean;
    volume: number;
    progress: number;
};

export type TTitlePlaylist = {
    id: string;
    title: string;
    tracks: TTrackItem[];
    isRadio: boolean;
    accessHash: string;
    ownerId: string;
    blockId: string;
    nextOffset: string;
    hasMore: boolean;
};

export type TCoverPlaylist = TTitlePlaylist & {
    coverUrl: string;
    gridCoverUrls: string[];
    authorLine: string;
    authorName: string;
};

export type TAudioAccessKeyIndex = {
    accessKey: string;
    previousTrackId: string;
    nextTrackId: string;
    isLast: boolean;
};

export type TAudioTuple = [
    audioRawId: string,
    accessKey: string,
];
