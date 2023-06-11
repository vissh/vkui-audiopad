import { baseTypes, vkFetch, vkFetchUtils } from "@vk-audiopad/common";
import { TFetchCoverPlaylistsResult, TFetchNextSectionArgs } from "./types";

export const fetchCoverPlaylists = async (ownerId: string): Promise<TFetchCoverPlaylistsResult> => {
    const url = "https://vk.com/audios" + ownerId + "?block=my_playlists&section=all";
    const resp = await fetch(url);

    const hmtlElement = document.createElement("html");
    hmtlElement.innerHTML = await vkFetchUtils.win1251ResponseToUTF8String(resp);

    const nodeElement = hmtlElement.querySelector('[data-type=music_playlists]');
    const sectionId = nodeElement && nodeElement.getAttribute("data-id") || "";
    const nextFrom = nodeElement && nodeElement.getAttribute("data-next") || "";
    const coverPlaylists: baseTypes.TCoverPlaylist[] = [];

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

export const fetchMoreCoverPlaylists = async (args: TFetchNextSectionArgs): Promise<TFetchCoverPlaylistsResult> => {
    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
        al: "1",
        section_id: args.sectionId,
        start_from: args.nextFrom,
    });

    const payload = parsedData.payload[1][1];
    const coverPlaylists: baseTypes.TCoverPlaylist[] = payload.playlists.map((p: any) => vkFetchUtils.toCoverPlaylist(p));

    return {
        nextFrom: payload.nextFrom,
        sectionId: args.sectionId,
        coverPlaylists: coverPlaylists,
    };
};

const getText = (elements: any): string => {
    return (elements.length > 0 ? (elements[0] as HTMLElement).innerText : "").trim();
};
