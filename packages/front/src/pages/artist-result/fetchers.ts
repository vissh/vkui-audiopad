import { vkFetch } from "@vk-audiopad/common";
import { getPlaylistBlocks } from "shared/lib/parsers/playlistBlock";
import { TPlaylistBlock } from "shared/types";

export const fetchArtistData = async (artistId: string): Promise<TPlaylistBlock[]> => {

    const resp = await fetch(`https://vk.com/artist/${artistId}`);
    const html = await resp.text();

    const sectionId = html.match(/"sectionId":\s?"(?<sectionId>\w+)"/)?.groups?.sectionId;

    if (!sectionId) {
        return [];
    }

    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
        al: "1",
        section_id: sectionId,
    });

    return getPlaylistBlocks(jsonData);
};
