import { ISearchFetchData } from "../../types";
import { vkFetch } from "../client";
import { toTracksItems } from "../utils";

export async function fetchSearchTracksSection(value: string): Promise<ISearchFetchData> {

    const parsedData = await vkFetch("https://vk.com/al_audio.php",
        {
            type: "search",
            act: "load_section",
            al: "1",
            owner_id: "8902548",
            offset: "0",
            album_id: "",
            search_lyrics: "0",
            search_history: "0",
            search_sort: "0",
            search_performer: "0",
            search_q: value,
            claim: "0",
        });

    return {
        tracks: toTracksItems(parsedData.payload[1][0].list),
    }
}
