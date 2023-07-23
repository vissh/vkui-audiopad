import { baseEnums, vkFetch } from "@vk-audiopad/common";
import { getTextFromHtmlElements, toCoverPlaylist, toTitlePlaylist } from "shared/lib/utils";
import { TFetchMyMusicResult } from "./types";

export const fetchMyMusic = async (ownerId: string): Promise<TFetchMyMusicResult> => {

    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: ownerId,
        section: "all",
    });

    const htmlElement = document.createElement("html");
    htmlElement.innerHTML = jsonData.payload[1][0];

    const playlists: any[] = jsonData.payload[1][1].playlists;

    return playlists.reduce((result: TFetchMyMusicResult, playlist: any) => {
        if (playlist.type === "my" && playlist.list?.length) {
            if (playlist.list[0][baseEnums.EAudioTupleIndex.CONTEXT] === baseEnums.EPlaylistType.RECENT_AUDIOS) {
                result.recentTracksPlaylist = toTitlePlaylist(playlist);
            } else if (playlist.list[0][baseEnums.EAudioTupleIndex.CONTEXT] === baseEnums.EPlaylistType.MY_AUDIOS) {
                result.playlist = toTitlePlaylist(playlist);
            }
        } else if (playlist.type === "radio") {
            result.radiostationsPlaylist = toTitlePlaylist(playlist);
        } else if (playlist.type === "playlist") {
            playlist.infoLine = getYearInfo(htmlElement, playlist);
            result.coverPlaylists.push(toCoverPlaylist(playlist));
        }
        return result;
    }, {
        playlist: null,
        recentTracksPlaylist: null,
        radiostationsPlaylist: null,
        coverPlaylists: [],
    });
};

const getYearInfo = (htmlElement: HTMLHtmlElement, playlist: any): string => {
    const audioElements = htmlElement.getElementsByClassName("_audio_pl_" + playlist.ownerId + "_" + playlist.id);
    if (audioElements.length > 0) {
        const yearElements = audioElements[0].getElementsByClassName("audio_pl__year_subtitle");
        if (yearElements.length > 0) {
            return getTextFromHtmlElements(yearElements);
        }
    }

    return "";
};
