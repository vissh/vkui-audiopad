import { ICatalogFetchData } from "../../types";
import { vkFetch } from "../client";
import { toPlaylist } from "../utils";

export async function fetchCatalogSection(sectionId: string, startFrom: string): Promise<ICatalogFetchData> {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section",
        {
            al: "1",
            section_id: sectionId,
            start_from: startFrom,
        });

    const playlist = parsedData.payload[1][1].playlist;

    return {
        title: playlist.title,
        ...toPlaylist(playlist),
    };
}
