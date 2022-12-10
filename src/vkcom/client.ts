import { decode } from "html-entities";

import { GeneralFetchData, ICoverPlaylist, ITrackItem, MyMusicFetchData, SearchFetchData } from "../types";
import {
    AUDIO_ITEM_AVATAR, AUDIO_ITEM_INDEX_CONTEXT, AUDIO_ITEM_INDEX_DURATION, AUDIO_ITEM_INDEX_ID, AUDIO_ITEM_INDEX_PERFORMER,
    AUDIO_ITEM_INDEX_TITLE
} from "./constants";
import { vkFetch } from "./utils";

enum PlaylistType {
    GENERAL_MY_AUDIOS = "general:my_audios_block",
    RECENT_AUDIOS = "my:recent_audios",
    MY_AUDIOS = "my:my_audios",
};

export async function userAccessToken() {

}

export async function fetchGeneralSection(ownerId?: string): Promise<GeneralFetchData> {
    // Возвращает плейлисты для главной страницы.
    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=section",
        {
            act: "section",
            al: "1",
            claim: "0",
            is_layer: "0",
            owner_id: "8902548",
            section: "general",
        });

    const playlists: any[] = parsedData.payload[1][1].playlists;

    const myTracks: ITrackItem[] = [];
    const baseOnYourTastes: ICoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.list?.length) {
            if (playlist.list[0][AUDIO_ITEM_INDEX_CONTEXT] === PlaylistType.GENERAL_MY_AUDIOS) {
                myTracks.push(...toTracksItems(playlist.list));
            }
        } else if (playlist.is_generated_playlist) {
            baseOnYourTastes.push(toTypedPlaylist(playlist));
        }
    });

    return {
        myTracks: myTracks,
        recentTracks: [],
        baseOnYourTastes: baseOnYourTastes,
    }
}

export async function fetchMyMusicSection(ownerId?: string): Promise<MyMusicFetchData> {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=section",
        {
            act: "section",
            al: "1",
            claim: "0",
            is_layer: "0",
            owner_id: "8902548",
            section: "all",
        });

    const playlists: any[] = parsedData.payload[1][1].playlists;

    const recentTracks: ITrackItem[] = [];
    const myTracks: ITrackItem[] = [];
    const myPlaylists: ICoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.type === "my" && playlist.list?.length) {
            if (playlist.list[0][AUDIO_ITEM_INDEX_CONTEXT] === PlaylistType.RECENT_AUDIOS) {
                recentTracks.push(...toTracksItems(playlist.list));
            } else if (playlist.list[0][AUDIO_ITEM_INDEX_CONTEXT] === PlaylistType.MY_AUDIOS) {
                myTracks.push(...toTracksItems(playlist.list));
            }
        } else if (playlist.type === "playlist") {
            myPlaylists.push(toTypedPlaylist(playlist));
        }
    });

    return {
        myTracks: myTracks,
        recentTracks: recentTracks,
        myPlaylists: myPlaylists,
    }
}

export async function fetchSearchTracksSection(value: string): Promise<SearchFetchData> {

    const parsedData = await vkFetch("https://vk.com/al_audio.php",
        {
            type: "search",
            act: "load_section",
            al: "1",
            owner_id: "8902548",
            offset: "0",
            album_id: "",
            search_lyrics: "0",
            search_history: "0",
            search_sort: "0",
            search_performer: "0",
            search_q: value,
            claim: "0",
        });

    return {
        tracks: toTracksItems(parsedData.payload[1][0].list),
    }
}

function toTracksItems(arr: any[]): ITrackItem[] {
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

function toTypedPlaylist(playlist: any): ICoverPlaylist {
    const gridCoverUrls: string[] = [];

    if (!playlist.coverUrl && playlist.gridCovers) {
        const hmtlElement = document.createElement("html");
        hmtlElement.innerHTML = playlist.gridCovers;
        hmtlElement.querySelectorAll('[style^="background-image:url"]').forEach(el => {
            const url = (el as HTMLInputElement).style?.backgroundImage.slice(4, -1).replace(/"/g, "");
            url && gridCoverUrls.push(url);
        });
    }

    const coverUrl = playlist.coverUrl || (gridCoverUrls.length && gridCoverUrls[0]) || "";
    !gridCoverUrls.length && coverUrl && gridCoverUrls.push(coverUrl);

    return {
        id: playlist.id,
        ownerId: playlist.ownerId,
        coverUrl: coverUrl,
        gridCoverUrls: gridCoverUrls,
        title: getText(playlist.title),
        authorLine: getText(playlist.authorLine),
        authorName: getText(playlist.authorName),
    }
}

function getText(str: string) {
    if (str.startsWith("<")) {
        const hmtlElement = document.createElement("html");
        hmtlElement.innerHTML = str;
        str = hmtlElement.innerText;
    }
    return decode(str);
}


// https://vk.com/al_audio.php?act=section
// act: section
// act=section&al=1&claim=0&is_layer=0&owner_id=8902548&performer=1&q=%D0%A1%D0%BA%D1%80%D0%B8%D0%BF%D1%82%D0%BE%D0%BD%D0%B8%D1%82%20x%20104%20x%20Truwer&section=search


// https://vk.com/al_audio.php?act=section
// act=section&al=1&claim=0&is_layer=0&owner_id=8902548&section=explore
// https://vk.com/al_audio.php?act=load_catalog_section
// al=1&section_id=PUldVA8FR0RzSVNUUEwbCikZDFQZFlJEfFpFVA0WUV5_W1tDAQwW&start_from=PUlYVA8AFg
// section_id и start_from брать из explore payload.1.1.sectionId, next_from


// https://login.vk.com/?act=web_token
// version	"1"
// app_id	"7598768"
// access_token	""
