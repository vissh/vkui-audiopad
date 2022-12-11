import { ICoverPlaylist, IMyMusicFetchData, IPlaylist } from "../../types";
import { PlaylistType, vkFetch } from "../client";
import { AUDIO_ITEM_INDEX_CONTEXT } from "../constants";
import { toCoverPlaylist, toPlaylist } from "../utils";

export async function fetchMyMusicSection(ownerId?: string): Promise<IMyMusicFetchData> {

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

    let myPlaylist: IPlaylist | null = null;
    let recentTracksPlaylist: IPlaylist | null = null;
    const coverPlaylists: ICoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.type === "my" && playlist.list?.length) {
            if (playlist.list[0][AUDIO_ITEM_INDEX_CONTEXT] === PlaylistType.RECENT_AUDIOS) {
                recentTracksPlaylist = toPlaylist(playlist);
            } else if (playlist.list[0][AUDIO_ITEM_INDEX_CONTEXT] === PlaylistType.MY_AUDIOS) {
                myPlaylist = toPlaylist(playlist);
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
