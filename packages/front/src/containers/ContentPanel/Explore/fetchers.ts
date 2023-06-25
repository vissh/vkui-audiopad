import { vkFetch } from "@vk-audiopad/common";
import { getPlaylistBlocks } from "../../../core/parsers/playlistBlock";
import { TFetchExploreResult, TFetchMoreExploreArgs } from "./types";

export const fetchExplore = async (ownerId: string): Promise<TFetchExploreResult> => {
    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: ownerId,
        section: "explore",
    });

    return prepareResult(jsonData);
};

export const fetchMoreExplore = async ({ sectionId, nextFrom }: TFetchMoreExploreArgs): Promise<TFetchExploreResult> => {
    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
        al: "1",
        section_id: sectionId,
        start_from: nextFrom,
    });

    return prepareResult(jsonData);
};

const prepareResult = (jsonData: any): TFetchExploreResult => {
    const payload = jsonData.payload[1][1];

    return {
        nextFrom: payload.nextFrom,
        sectionId: payload.sectionId,
        playlistBlocks: getPlaylistBlocks(jsonData),
    };
};
