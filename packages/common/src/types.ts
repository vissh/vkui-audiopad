import { ErrorObject } from "serialize-error";

export enum ContentTab {
    UNKNOWN = "unknown",
    CURRENT_PLAYLIST = "current-playlist",
    GENERAL = "general",
    MY_MUSIC = "my-music",
    EXPLORE = "explore",
    SEARCH = "search",
    BLOCK_PLAYLIST = "block-playlist",
    COVER_PLAYLISTS = "cover-playlists",
}

export type TypeWebTokenError = {
    type: "unauthorized" | "exception";
    serializedError: ErrorObject | null;
};

export type TypeWebToken = {
    userId: string;
    accessToken: string;
    expires: number;
    logoutHash: string;
    error: TypeWebTokenError | null;
};

export type TypeSelectedTabSearch = {
    tab: ContentTab.SEARCH;
    value: string;
};

export type TypeSelectedPlaylist = {
    tab: ContentTab.BLOCK_PLAYLIST;
    fromId: string;
    playlist: TypeTitlePlaylist;
};

export type TypeSelectedCoverPlaylists = {
    tab: ContentTab.COVER_PLAYLISTS;
    fromId: string;
};

export type TypeSelectedTabClickable = Exclude<Exclude<Exclude<ContentTab, ContentTab.SEARCH>, ContentTab.BLOCK_PLAYLIST>, ContentTab.COVER_PLAYLISTS>;

export type TypeSelectedTabCommon = {
    tab: TypeSelectedTabClickable;
};

export type SelectedTabs = TypeSelectedTabCommon | TypeSelectedTabSearch | TypeSelectedPlaylist | TypeSelectedCoverPlaylists;

export enum EnumRepeat {
    NONE = 0,
    REPEAT = 1,
    REPEAT_ONE = 2,
}

export type TypeApplicationState = {
    [index: string]: string | TypeWebToken | TypeTitlePlaylist | TypeTrackItem | number | boolean | TypeAudioIds | SelectedTabs | null;
    userId: string;
    volume: number;
    repeat: EnumRepeat;
    webToken: TypeWebToken | null;
    deviceId: string;
    currentPlaylist: TypeTitlePlaylist | null;
    activeTrack: TypeTrackItem | null;
    activeTrackIndex: number;
    played: boolean;
    duration: number;
    currentTime: number;
    audiosIds: TypeAudioIds;
    selectedTab: SelectedTabs;
};

export enum EAudioFlagBit {
    HAS_LYRICS = 1 << 0,
    CAN_ADD = 1 << 1,
    CLAIMED = 1 << 2,
    QUEUE = 1 << 3,
    HQ = 1 << 4,
    LONG_PERFORMER = 1 << 5,
    UMA = 1 << 7,
    REPLACEABLE = 1 << 9,
    EXPLICIT = 1 << 10,
}

export type TypeTrackItem = {
    id: string;
    accessKey: string;
    url: string;
    image: string;
    artist: string;
    title: string;
    duration: number;
    context: string;
    flags: number;
    addHash: string;
    editHash: string;
    actionHash: string;
    deleteHash: string;
    replaceHash: string;
    urlHash: string;
    restoreHash: string;
};

export type TypeControl = {
    played: boolean;
    volume: number;
    progress: number;
};

export type TypeTitlePlaylist = {
    id: string;
    title: string;
    tracks: TypeTrackItem[];
    isRadio: boolean;
    accessHash: string;
    ownerId: string;
    blockId: string;
    nextOffset: string;
    hasMore: boolean;
};

export type TypeCoverPlaylist = TypeTitlePlaylist & {
    coverUrl: string;
    gridCoverUrls: string[];
    authorLine: string;
    authorName: string;
};

export type TypeMyMusicFetchResult = {
    playlist: TypeTitlePlaylist | null;
    recentTracksPlaylist: TypeTitlePlaylist | null;
    coverPlaylists: TypeCoverPlaylist[];
};

export type TypeGeneralFetchResult = {
    playlist: TypeTitlePlaylist | null;
    baseOnYourTastes: TypeCoverPlaylist[];
};

export type TypeExploreFetchResult = {
    nextFrom: string;
    sectionId: string;
    playlists: TypeTitlePlaylist[];
};

export type TypeNextSectionFetchArgs = {
    nextFrom: string;
    sectionId: string;
};

export type TypeSearchFetchArguments = {
    ownerId: string;
    value: string;
};

export type TypeSearchFetchResult = {
    trackPlaylists: TypeTitlePlaylist[],
    officialAlbums: TypeCoverPlaylist[],
    otherPlaylists: TypeCoverPlaylist[],
};

export type TypePlaylistFetchArguments = {
    fromId: string;
    playlist: TypeTitlePlaylist;
};

export type TypePlaylistFetchResult = {
    playlist: TypeTitlePlaylist;
};

export type TypeCoverPlaylistsFetchResult = {
    nextFrom: string;
    sectionId: string;
    coverPlaylists: TypeCoverPlaylist[];
};

export type TypeAudioAccessKeyIndex = {
    accessKey: string;
    previousTrackId: string;
    nextTrackId: string;
    isLast: boolean;
};

export type TypeAudioTuple = [
    accessKey: string,
    nextTrackId: string,
    previousTrackId: string,
    isLast: boolean,
];

export type TypeAudioIds = {
    [index: string]: TypeAudioTuple;
};

export enum EndOfStreamReason {
    Next = 'next_btn',
    Prev = 'prev',
    PlaylistChange = 'playlist_change',
    PlaylistNext = 'playlist_next',
    Pause = 'stop_btn',
    SessionEnd = 'session_end',
    New = 'new',
}

export type TypeListenedDataFetchArgs = {
    userId: string;
    track: TypeTrackItem;
    listened: number;
    endStreamReason: EndOfStreamReason;
};
