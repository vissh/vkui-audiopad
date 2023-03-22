import { TypeCoverPlaylist, TypeGeneralFetchResult, TypeTitlePlaylist } from "../../types";
import { PlaylistType, vkFetch } from "../client";
import { EAudioTupleIndex } from "../enums";
import { toCoverPlaylist, toTitlePlaylist } from "../utils";

export const general = async (ownerId: string): Promise<TypeGeneralFetchResult> => {
    // Возвращает плейлисты для главной страницы.
    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: ownerId,
        section: "general",
    });

    const playlists: any[] = parsedData.payload[1][1].playlists;

    let myPlaylist: TypeTitlePlaylist | null = null;
    const coverPlaylists: TypeCoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.list?.length) {
            if (playlist.list[0][EAudioTupleIndex.CONTEXT] === PlaylistType.GENERAL_MY_AUDIOS) {
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
};
