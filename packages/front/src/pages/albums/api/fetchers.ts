import { vkFetch } from "@vk-audiopad/common";
import { getPlaylistBlocks } from "shared/lib/parsers/playlist-block";
import { TFetchAlbumsResult, TFetchNextSectionArgs } from "../model/types";

export const fetchAlbums = async (showAllLink: string): Promise<TFetchAlbumsResult> => {

    const resp = await fetch(`https://vk.com${showAllLink}`);
    const html = await resp.text();

    const sectionId = html.match(/"sectionId":\s?"(?<sectionId>\w+)"/)?.groups?.sectionId;

    return fetchMoreAlbums({ nextFrom: "", sectionId: sectionId || "" });
};

export const fetchMoreAlbums = async (args: TFetchNextSectionArgs): Promise<TFetchAlbumsResult> => {
    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
        al: "1",
        section_id: args.sectionId,
        start_from: args.nextFrom,
    });

    const payload = jsonData.payload[1][1];

    const playlistBlocks = getPlaylistBlocks(jsonData)
    console.log(playlistBlocks)

    return {
        nextFrom: payload.nextFrom,
        sectionId: payload.sectionId,
        playlistBlocks: playlistBlocks,
    };
};
