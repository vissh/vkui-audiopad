import { baseTypes, vkFetch, vkFetchUtils } from "@vk-audiopad/common";
import { TFetchExploreResult, TFetchMoreExploreArgs } from "./types";

export const fetchExplore = async (ownerId: string): Promise<TFetchExploreResult> => {
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

export const fetchMoreExplore = async ({ sectionId, nextFrom }: TFetchMoreExploreArgs): Promise<TFetchExploreResult> => {
    return prepareResult(
        await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
            al: "1",
            section_id: sectionId,
            start_from: nextFrom,
        }));
};

const prepareResult = (parsedData: any): TFetchExploreResult => {
    const payload = parsedData.payload[1][1];

    const playlists: baseTypes.TTitlePlaylist[] = (payload?.playlists || [])
        .filter((playlistInfo: any) => playlistInfo.list && playlistInfo.list.length > 0)
        .map((playlistInfo: any) => vkFetchUtils.toTitlePlaylist(playlistInfo))
        .filter((playlist: baseTypes.TTitlePlaylist) => playlist.tracks.length > 0);

    return {
        nextFrom: payload.nextFrom,
        sectionId: payload.sectionId,
        playlists: playlists,
    }
};
