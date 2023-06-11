import { baseEnums, baseTypes, vkFetch, vkFetchUtils } from "@vk-audiopad/common";
import { TFetchGeneralResult } from "./types";

export const fetchGeneral = async (ownerId: string): Promise<TFetchGeneralResult> => {
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

    let myPlaylist: baseTypes.TTitlePlaylist | null = null;
    const coverPlaylists: baseTypes.TCoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.list?.length) {
            if (playlist.list[0][baseEnums.EAudioTupleIndex.CONTEXT] === baseEnums.EPlaylistType.GENERAL_MY_AUDIOS) {
                myPlaylist = vkFetchUtils.toTitlePlaylist(playlist);
            }
        } else if (playlist.is_generated_playlist) {
            coverPlaylists.push(vkFetchUtils.toCoverPlaylist(playlist));
        }
    });

    return {
        playlist: myPlaylist,
        baseOnYourTastes: coverPlaylists,
    }
};
