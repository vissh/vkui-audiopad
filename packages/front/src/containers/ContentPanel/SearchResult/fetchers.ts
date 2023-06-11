import { baseTypes, vkFetch, vkFetchUtils } from "@vk-audiopad/common";
import { TFetchSearchArgs, TFetchSearchResult } from "./types";

export const fetchSearchTracks = async ({ ownerId, value }: TFetchSearchArgs): Promise<TFetchSearchResult> => {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: ownerId,
        q: value,
        section: "search",
    });

    const playlists = parsedData.payload[1][1].playlists;

    const trackPlaylists: baseTypes.TTitlePlaylist[] = [];
    const officialAlbums: baseTypes.TCoverPlaylist[] = [];
    const otherPlaylists: baseTypes.TCoverPlaylist[] = [];

    playlists.forEach((playlist: any) => {
        if (playlist.type === "search" && playlist.list?.length) {
            trackPlaylists.push(vkFetchUtils.toTitlePlaylist(playlist));
        } else if (playlist.type === "playlist" && !playlist.list?.length) {
            const coverPlaylist = (playlist.isOfficial ? officialAlbums : otherPlaylists);
            coverPlaylist.push(vkFetchUtils.toCoverPlaylist(playlist));
        }
    });

    return {
        trackPlaylists: trackPlaylists,
        officialAlbums: officialAlbums,
        otherPlaylists: otherPlaylists,
    }
};
