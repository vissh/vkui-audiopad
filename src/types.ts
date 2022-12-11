// Типы контентов.
export enum ContentTab {
    CURRENT_PLAYLIST = "current-playlist",
    GENERAL = "general",
    MY_MUSIC = "my-music",
    EXPLORE = "explore",
    SEARCH = "search",
    CUSTOM_PLAYLIST = "custom-playlist",
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

// Плейлисты, которые содержат свое собственное наименование.
export interface ITitlePlaylist extends IPlaylist {
    title: string;
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
export interface IMyMusicFetchData {
    playlist: IPlaylist | null;
    recentTracksPlaylist: IPlaylist | null;
    coverPlaylists: ICoverPlaylist[];
}

// Данные для отображения во вкладке "Главная".
export interface IGeneralFetchData {
    myTracks: ITrackItem[];
    recentTracks: ITrackItem[];
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

// Данные для отображения загрузки доп секции, например отображение полного плейлиста.
export interface ICatalogFetchData extends ITitlePlaylist {

}