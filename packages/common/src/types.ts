// Типы контентов.
export enum ContentTab {
    CURRENT_PLAYLIST = "current-playlist",
    GENERAL = "general",
    MY_MUSIC = "my-music",
    EXPLORE = "explore",
    SEARCH = "search",
    BLOCK_PLAYLIST = "block-playlist",
}

// Базовый интерфейс, описывающий аудиозапись.
export interface ITrackItem {
    id: string;
    image: string;
    artist: string;
    title: string;
    duration: number;
}

// Плейлисты, которые содержат свое собственное наименование.
export interface ITitlePlaylist {
    id: string;
    title: string;
    tracks: ITrackItem[];
    accessHash: string;
    ownerId: string;
    blockId: string;
    nextOffset: string;
    hasMore: boolean;
}

// Интерфейс, описывающий плейлист с картинкой.
// Плейлист не содержит треков, необходимо загружать по id и nextOffset.
export interface ICoverPlaylist extends ITitlePlaylist {
    coverUrl: string;
    gridCoverUrls: string[];
    authorLine: string;
    authorName: string;
}

// Данные для отображения во вкладке "Моя музыка".
export interface IMyMusicFetchData {
    playlist: ITitlePlaylist | null;
    recentTracksPlaylist: ITitlePlaylist | null;
    coverPlaylists: ICoverPlaylist[];
}

// Данные для отображения во вкладке "Главная".
export interface IGeneralFetchData {
    playlist: ITitlePlaylist | null;
    baseOnYourTastes: ICoverPlaylist[];
}

// Данные для отображения во вкладке "Обзор".
export interface IExploreFetchData {
    playlists: ITitlePlaylist[];
}

// Данные для отображения результата поиска.
export interface ISearchFetchData {
    tracks: ITrackItem[];
}
