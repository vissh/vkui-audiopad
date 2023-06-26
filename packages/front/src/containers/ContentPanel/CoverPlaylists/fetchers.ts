import { vkFetch } from "@vk-audiopad/common";
import { TCoverPlaylist } from "../../../core/types/playlists";
import { getTextFromHtmlElements, toCoverPlaylist } from "../../../core/utils";
import { TFetchCoverPlaylistsResult, TFetchNextSectionArgs } from "./types";

export const fetchCoverPlaylists = async (showAllLink: string): Promise<TFetchCoverPlaylistsResult> => {

    const resp = await fetch(`https://vk.com${showAllLink}`);
    const html = await resp.text();

    const sectionId = html.match(/"sectionId":\s?"(?<sectionId>\w+)"/)?.groups?.sectionId;

    return fetchMoreCoverPlaylists({ nextFrom: "", sectionId: sectionId || "" });
};

export const fetchMoreCoverPlaylists = async (args: TFetchNextSectionArgs): Promise<TFetchCoverPlaylistsResult> => {
    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
        al: "1",
        section_id: args.sectionId,
        start_from: args.nextFrom,
    });

    const htmlElement = document.createElement("html");
    htmlElement.innerHTML = jsonData.payload[1][0];

    const payload = jsonData.payload[1][1];
    const playlistHtml = jsonData.payload[1][2];

    const coverPlaylists: TCoverPlaylist[] = (
        Array
            .from(payload.playlists)
            .map((p: any, index: number) => {
                p.infoLine = getYearInfo(playlistHtml[index]);
                return toCoverPlaylist(p);
            }));

    return {
        nextFrom: payload.nextFrom,
        sectionId: args.sectionId,
        coverPlaylists: coverPlaylists,
    };
};

const getYearInfo = (html: string) => {
    const htmlElement = document.createElement("html");
    htmlElement.innerHTML = html;
    const yearElements = htmlElement.getElementsByClassName("audio_pl__year_subtitle");
    if (yearElements.length > 0) {
        return getTextFromHtmlElements(yearElements);
    }
    return "";
};
