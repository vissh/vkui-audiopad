import { vkFetch } from "@vk-audiopad/common";
import { getPlaylistBlocks } from "shared/lib/parsers/playlistBlock";
import { FetchArtistResult } from "./types";

export const fetchArtistData = async (artistId: string): Promise<FetchArtistResult> => {

    const resp = await fetch(`https://vk.com/artist/${artistId}`);
    const html = await resp.text();

    const sectionId = html.match(/"sectionId":\s?"(?<sectionId>\w+)"/)?.groups?.sectionId;

    if (!sectionId) {
        return {
            backgroundImage: "",
            playlistBlocks: [],
        };
    }

    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
        al: "1",
        section_id: sectionId,
    });

    return {
        backgroundImage: getBackgroundImage(jsonData.payload[1][0]),
        playlistBlocks: getPlaylistBlocks(jsonData),
    }
};


const getBackgroundImage = (html: string): string => {
    const htmlElement = document.createElement("html");
    htmlElement.innerHTML = html;
    const coverElements = htmlElement.getElementsByClassName("MusicAuthor_block__cover");
    return (coverElements && coverElements.length && (coverElements[0] as HTMLDivElement).style.backgroundImage) || "";
};
