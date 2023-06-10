export enum EContentTab {
    UNKNOWN = "unknown",
    CURRENT_PLAYLIST = "current-playlist",
    GENERAL = "general",
    MY_MUSIC = "my-music",
    EXPLORE = "explore",
    SEARCH = "search",
    BLOCK_PLAYLIST = "block-playlist",
    COVER_PLAYLISTS = "cover-playlists",
}

export enum ERepeat {
    NONE = 0,
    REPEAT = 1,
    REPEAT_ONE = 2,
}

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

export enum EEndOfStreamReason {
    Next = 'next_btn',
    Prev = 'prev',
    PlaylistChange = 'playlist_change',
    PlaylistNext = 'playlist_next',
    Pause = 'stop_btn',
    SessionEnd = 'session_end',
    New = 'new',
}

export enum EAudioTupleIndex {
    ID = 0,
    OWNER_ID = 1,
    URL = 2,
    TITLE = 3,
    PERFORMER = 4,
    DURATION = 5,
    ALBUM_ID = 6,
    AUTHOR_LINK = 8,
    LYRICS = 9,
    FLAGS = 10,
    CONTEXT = 11,
    EXTRA = 12,
    HASHES = 13,
    COVER_URL = 14,
    ADS = 15,
    SUBTITLE = 16,
    MAIN_ARTISTS = 17,
    FEAT_ARTISTS = 18,
    ALBUM = 19,
    TRACK_CODE = 20,
    RESTRICTION = 21,
    ALBUM_PART = 22,
    ACCESS_KEY = 24,
    CHART_INFO = 25,
    TRACK_PAGE_ID = 26,
    IS_ORIGINAL_SOUND = 27,
}

export enum EPlaylistType {
    GENERAL_MY_AUDIOS = "general:my_audios_block",
    RECENT_AUDIOS = "my:recent_audios",
    MY_AUDIOS = "my:my_audios",
}

export enum EDurationMode {
    TIME_PASSED = 0,
    TIME_LEFT = 1,
}

export enum ETheme {
    SYSTEM = "system",
    LIGHT = "light",
    DARK = "dark",
}