import { ICoverPlaylist, IGeneralFetchData, ITitlePlaylist } from "../../types";
import { PlaylistType, vkFetch } from "../client";
import { AUDIO_ITEM_INDEX_CONTEXT } from "../constants";
import { toCoverPlaylist, toTitlePlaylist } from "../utils";

export async function fetchGeneralSection(): Promise<IGeneralFetchData> {
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

    let myPlaylist: ITitlePlaylist | null = null;
    const coverPlaylists: ICoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.list?.length) {
            if (playlist.list[0][AUDIO_ITEM_INDEX_CONTEXT] === PlaylistType.GENERAL_MY_AUDIOS) {
                myPlaylist = toTitlePlaylist(playlist);
            }
        } else if (playlist.is_generated_playlist) {
            coverPlaylists.push(toCoverPlaylist(playlist));
        }
    });

    return {
        playlist: myPlaylist,
        baseOnYourTastes: coverPlaylists,
    }
}
