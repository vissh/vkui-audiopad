import { TypeCoverPlaylist, TypeMyMusicFetchResult, TypeTitlePlaylist } from "../../types";
import { PlaylistType, vkFetch } from "../client";
import { EAudioTupleIndex } from "../enums";
import { toCoverPlaylist, toTitlePlaylist } from "../utils";

export const myMusic = async (ownerId: string): Promise<TypeMyMusicFetchResult> => {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: ownerId,
        section: "all",
    });

    const playlists: any[] = parsedData.payload[1][1].playlists;

    let myPlaylist: TypeTitlePlaylist | null = null;
    let recentTracksPlaylist: TypeTitlePlaylist | null = null;
    const coverPlaylists: TypeCoverPlaylist[] = [];

    playlists.forEach(playlist => {
        if (playlist.type === "my" && playlist.list?.length) {
            if (playlist.list[0][EAudioTupleIndex.CONTEXT] === PlaylistType.RECENT_AUDIOS) {
                recentTracksPlaylist = toTitlePlaylist(playlist);
            } else if (playlist.list[0][EAudioTupleIndex.CONTEXT] === PlaylistType.MY_AUDIOS) {
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
};
