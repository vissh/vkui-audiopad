import { baseEnums, baseTypes, vkFetch, vkFetchUtils } from "@vk-audiopad/common";
import { TFetchMyMusicResult } from "./types";

export const fetchMyMusic = async (ownerId: string): Promise<TFetchMyMusicResult> => {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: ownerId,
        section: "all",
    });

    const playlists: any[] = parsedData.payload[1][1].playlists;

    let myPlaylist: baseTypes.TTitlePlaylist | null = null;
    let recentTracksPlaylist: baseTypes.TTitlePlaylist | null = null;
    const coverPlaylists: baseTypes.TCoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.type === "my" && playlist.list?.length) {
            if (playlist.list[0][baseEnums.EAudioTupleIndex.CONTEXT] === baseEnums.EPlaylistType.RECENT_AUDIOS) {
                recentTracksPlaylist = vkFetchUtils.toTitlePlaylist(playlist);
            } else if (playlist.list[0][baseEnums.EAudioTupleIndex.CONTEXT] === baseEnums.EPlaylistType.MY_AUDIOS) {
                myPlaylist = vkFetchUtils.toTitlePlaylist(playlist);
            }
        } else if (playlist.type === "playlist") {
            coverPlaylists.push(vkFetchUtils.toCoverPlaylist(playlist));
        }
    });

    return {
        playlist: myPlaylist,
        recentTracksPlaylist: recentTracksPlaylist,
        coverPlaylists: coverPlaylists,
    }
};
