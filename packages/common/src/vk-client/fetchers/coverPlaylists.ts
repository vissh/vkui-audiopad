import axios from "axios";
import { TypeCoverPlaylist, TypeCoverPlaylistsFetchResult, TypeNextSectionFetchArgs } from "../../types";
import { vkFetch } from "../client";
import { toCoverPlaylist } from "../utils";

export const coverPlaylists = async (ownerId: string): Promise<TypeCoverPlaylistsFetchResult> => {
    const url = "https://vk.com/audios" + ownerId + "?block=my_playlists&section=all";
    const resp = await axios(url);

    const hmtlElement = document.createElement("html");
    hmtlElement.innerHTML = await resp.data;

    const nodeElement = hmtlElement.querySelector('[data-type=music_playlists]');
    const sectionId = nodeElement && nodeElement.getAttribute("data-id") || "";
    const nextFrom = nodeElement && nodeElement.getAttribute("data-next") || "";
    const coverPlaylists: TypeCoverPlaylist[] = [];

    if (nodeElement) {
        const elements = nodeElement.getElementsByClassName("audio_pl_item2");
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const dataId = element.getAttribute("data-id") || "";
            const [ownerId, playlistId] = dataId.split("_");
            const title = getText(element.getElementsByClassName("audio_item__title"));
            const subtitle = getText(element.getElementsByClassName("audio_pl__subtitle"));
            const imgElements = element.getElementsByTagName("img");
            const coverUrl = (imgElements.length > 0 ? imgElements[0].getAttribute("src") : "") || "";
            const gridCoverUrls = [coverUrl];

            coverPlaylists.push({
                id: playlistId,
                title: title,
                tracks: [],
                isRadio: false,
                accessHash: "",
                ownerId: ownerId,
                blockId: "",
                nextOffset: "",
                hasMore: true,
                coverUrl: coverUrl,
                gridCoverUrls: gridCoverUrls,
                authorLine: subtitle,
                authorName: subtitle,
            });

        }
    }

    return {
        nextFrom: nextFrom,
        sectionId: sectionId,
        coverPlaylists: coverPlaylists,
    };
};

const getText = (elements: any): string => {
    return (elements.length > 0 ? (elements[0] as HTMLElement).innerText : "").trim();
};

export const coverPlaylistsMore = async (args: TypeNextSectionFetchArgs): Promise<TypeCoverPlaylistsFetchResult> => {
    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
        al: "1",
        section_id: args.sectionId,
        start_from: args.nextFrom,
    });

    const payload = parsedData.payload[1][1];
    const coverPlaylists: TypeCoverPlaylist[] = payload.playlists.map((p: any) => toCoverPlaylist(p));

    return {
        nextFrom: payload.nextFrom,
        sectionId: args.sectionId,
        coverPlaylists: coverPlaylists,
    };
};
