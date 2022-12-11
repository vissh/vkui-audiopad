// Типы контентов.
export enum ContentTab {
    CURRENT_PLAYLIST = "current-playlist",
    GENERAL = "general",
    MY_MUSIC = "my-music",
    EXPLORE = "explore",
    SEARCH = "search",
}

// Базовый интерфейс, описывающий аудиозапись.
export interface ITrackItem {
    id: string;
    image: string;
    artist: string;
    title: string;
    duration: number;
}

// Интерфейс с полями, необходимые для дозагрузки данных.
interface IOffset {
    id: string | number;
    blockId: string | boolean;
    nextOffset: string;
    hasMore: boolean;
}

// Интерфейс, описывающий плейлист с треками.
// Содержит так же инфу полная ли информация
export interface IPlaylist extends IOffset {
    tracks: ITrackItem[];
}

// Интерфейс, описывающий плейлист с картинкой.
// Плейлист не содержит треков, необходимо загружать по id и nextOffset.
export interface ICoverPlaylist extends IOffset {
    ownerId: number;
    coverUrl: string;
    gridCoverUrls: string[];
    title: string;
    authorLine: string;
    authorName: string;
}

// Данные для отображения во вкладке "Моя музыка".
export interface MyMusicFetchData {
    playlist: IPlaylist | null;
    recentTracksPlaylist: IPlaylist | null;
    coverPlaylists: ICoverPlaylist[];
}

// Данные для отображения во вкладке "Главная".
export interface GeneralFetchData {
    myTracks: ITrackItem[];
    recentTracks: ITrackItem[];
    baseOnYourTastes: ICoverPlaylist[];
}

// Плейлисты, которые содержат свое собственное наименование.
export interface ExplorePlaylist extends IPlaylist {
    title: string;
}

// Данные для отображения во вкладке "Обзор".
export interface ExploreFetchData {
    playlists: ExplorePlaylist[];
}

// Данные для отображения результата поиска.
export interface SearchFetchData {
    tracks: ITrackItem[];
}
