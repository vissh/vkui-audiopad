import { ICoverPlaylist, IGeneralFetchData, ITrackItem } from "../../types";
import { PlaylistType, vkFetch } from "../client";
import { AUDIO_ITEM_INDEX_CONTEXT } from "../constants";
import { toCoverPlaylist, toTracksItems } from "../utils";

export async function fetchGeneralSection(ownerId?: string): Promise<IGeneralFetchData> {
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
            baseOnYourTastes.push(toCoverPlaylist(playlist));
        }
    });

    return {
        myTracks: myTracks,
        recentTracks: [],
        baseOnYourTastes: baseOnYourTastes,
    }
}
