import { TypeAudioIds, TypeTitlePlaylist } from "../../types";
import { vkFetch } from "../client";

export const audiosIdsBySource = async (playlist: TypeTitlePlaylist): Promise<TypeAudioIds> => {

    const params: Record<string, string> = playlist.blockId
        ? {
            al: "1",
            block_id: playlist.blockId,
            context: "",
            playlist_id: playlist.ownerId + "_" + playlist.id,
        }
        : {
            al: "1",
            entity_id: playlist.ownerId + "_" + playlist.id + (playlist.accessHash ? "_" + playlist.accessHash : ""),
            source: "playlist",
        };

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=get_audio_ids_by_source", params);

    const result: TypeAudioIds = {};

    parsedData.payload[1][0].forEach((trackInfo: Record<string, string>, index: number, array: Array<Record<string, string>>) => {
        const nextTrackId = array[(index + 1) % array.length].audio_raw_id;
        const previousTrackId = array[(index || array.length) - 1].audio_raw_id;
        const isLast = index === array.length - 1;

        result[trackInfo.audio_raw_id] = [
            trackInfo.access_key,
            nextTrackId,
            previousTrackId,
            isLast,
        ];
    });

    return result;
};
