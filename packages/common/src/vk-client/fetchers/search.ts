import { TypeCoverPlaylist, TypeSearchFetchArguments, TypeSearchFetchResult, TypeTitlePlaylist } from "../../types";
import { vkFetch } from "../client";
import { toCoverPlaylist, toTitlePlaylist } from "../utils";

export const searchTracks = async (fetchArgs: TypeSearchFetchArguments): Promise<TypeSearchFetchResult> => {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: fetchArgs.ownerId,
        q: fetchArgs.value,
        section: "search",
    });

    const playlists = parsedData.payload[1][1].playlists;

    const trackPlaylists: TypeTitlePlaylist[] = [];
    const officialAlbums: TypeCoverPlaylist[] = [];
    const otherPlaylists: TypeCoverPlaylist[] = [];

    playlists.forEach((playlist: any) => {
        if (playlist.type === "search" && playlist.list?.length) {
            trackPlaylists.push(toTitlePlaylist(playlist));
        } else if (playlist.type === "playlist" && !playlist.list?.length) {
            const coverPlaylist = (playlist.isOfficial ? officialAlbums : otherPlaylists);
            coverPlaylist.push(toCoverPlaylist(playlist));
        }
    });

    return {
        trackPlaylists: trackPlaylists,
        officialAlbums: officialAlbums,
        otherPlaylists: otherPlaylists,
    }
};
