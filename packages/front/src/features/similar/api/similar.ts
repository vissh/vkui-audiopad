import { baseTypes, vkFetch } from "@vk-audiopad/common";
import { toTitlePlaylist } from "shared/lib/utils";

export const fetchSimilarData = async (userId: string, track: baseTypes.TTrackItem): Promise<baseTypes.TTitlePlaylist | null> => {

    const resp = await fetch("https://vk.com/al_audio.php?" + new URLSearchParams({
        __query: "audio",
        _ref: `audios${userId}`,
        _rndVer: Math.round(Math.random() * 100000).toString(),
        al: "-1",
        al_id: userId,
        audio_id: track.id,
        section: "recoms_audio",
    }));

    const html = await resp.text();

    let sectionId = html.match(/"sectionId":\s?"(?<sectionId>\w+)"/)?.groups?.sectionId;
    if (!sectionId) {
        sectionId = html.match(/\\"sectionId\\":\s?\\"(?<sectionId>\w+)\\"/)?.groups?.sectionId;
    }

    if (!sectionId) {
        return null;
    }

    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section", {
        al: "1",
        section_id: sectionId,
    });

    const playlist = jsonData.payload[1][1].playlist;

    if (!playlist) {
        return null;
    }

    return toTitlePlaylist(playlist);
};
