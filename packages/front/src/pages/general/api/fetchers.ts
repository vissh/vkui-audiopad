import { baseEnums, baseTypes, vkFetch } from "@vk-audiopad/common";
import { toAlbum, toTitlePlaylist } from "shared/lib/utils";
import { TAlbum } from "shared/types";
import { TFetchGeneralResult } from "../model/types";

const vkMusicId = -147845620;

export const fetchGeneral = async (ownerId: string): Promise<TFetchGeneralResult> => {
    // Возвращает плейлисты для главной страницы.
    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: ownerId,
        section: "general",
    });

    const playlists: any[] = jsonData.payload[1][1].playlists;

    let myPlaylist: baseTypes.TTitlePlaylist | null = null;
    const generalAlbums: TAlbum[] = [];
    const vkMusicAlbums: TAlbum[] = [];

    playlists.forEach(playlist => {
        if (playlist.list?.length) {
            if (playlist.list[0][baseEnums.EAudioTupleIndex.CONTEXT] === baseEnums.EPlaylistType.GENERAL_MY_AUDIOS) {
                myPlaylist = toTitlePlaylist(playlist);
            }
        } else if (playlist.is_generated_playlist) {
            generalAlbums.push(toAlbum(playlist));
        } else if (playlist.ownerId === vkMusicId) {
            vkMusicAlbums.push(toAlbum(playlist));
        }
    });

    return {
        playlist: myPlaylist,
        baseOnYourTastes: generalAlbums,
        vkMusic: vkMusicAlbums,
    }
};
