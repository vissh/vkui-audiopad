import { ICoverPlaylist, ITrackItem, MyMusicFetchData } from "../../types";
import { PlaylistType, vkFetch } from "../client";
import { AUDIO_ITEM_INDEX_CONTEXT } from "../constants";
import { toTracksItems, toTypedPlaylist } from "../utils";

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
