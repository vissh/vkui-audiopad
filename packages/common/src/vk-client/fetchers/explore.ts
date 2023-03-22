import { TypeExploreFetchResult, TypeTitlePlaylist } from "../../types";
import { vkFetch } from "../client";
import { toTitlePlaylist } from "../utils";

export const explore = async (ownerId: string): Promise<TypeExploreFetchResult> => {
    return prepareResult(
        await vkFetch("https://vk.com/al_audio.php?act=section", {
            act: "section",
            al: "1",
            claim: "0",
            is_layer: "0",
            owner_id: ownerId,
            section: "explore",
        }));
};

export const exploreMore = async (previousResult: TypeExploreFetchResult): Promise<TypeExploreFetchResult> => {
    return prepareResult(
        await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
            al: "1",
            section_id: previousResult.sectionId,
            start_from: previousResult.nextFrom,
        }));
};

const prepareResult = (parsedData: any): TypeExploreFetchResult => {
    const payload = parsedData.payload[1][1];

    const playlists: TypeTitlePlaylist[] = (payload?.playlists || [])
        .filter((playlistInfo: any) => playlistInfo.list && playlistInfo.list.length > 0)
        .map((playlistInfo: any) => toTitlePlaylist(playlistInfo))
        .filter((playlist: TypeTitlePlaylist) => playlist.tracks.length > 0);

    return {
        nextFrom: payload.nextFrom,
        sectionId: payload.sectionId,
        playlists: playlists,
    }
};
