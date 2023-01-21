import { ICoverPlaylist, IMyMusicFetchData, ITitlePlaylist } from "../../types";
import { PlaylistType, vkFetch } from "../client";
import { AUDIO_ITEM_INDEX_CONTEXT } from "../constants";
import { toCoverPlaylist, toTitlePlaylist } from "../utils";

export async function fetchMyMusicSection(): Promise<IMyMusicFetchData> {

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

    let myPlaylist: ITitlePlaylist | null = null;
    let recentTracksPlaylist: ITitlePlaylist | null = null;
    const coverPlaylists: ICoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.type === "my" && playlist.list?.length) {
            if (playlist.list[0][AUDIO_ITEM_INDEX_CONTEXT] === PlaylistType.RECENT_AUDIOS) {
                recentTracksPlaylist = toTitlePlaylist(playlist);
            } else if (playlist.list[0][AUDIO_ITEM_INDEX_CONTEXT] === PlaylistType.MY_AUDIOS) {
                myPlaylist = toTitlePlaylist(playlist);
            }
        } else if (playlist.type === "playlist") {
            coverPlaylists.push(toCoverPlaylist(playlist));
        }
    });

    return {
        playlist: myPlaylist,
        recentTracksPlaylist: recentTracksPlaylist,
        coverPlaylists: coverPlaylists,
    }
}
