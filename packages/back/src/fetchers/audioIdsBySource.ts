import { baseTypes, vkFetch } from "@vk-audiopad/common";

export const fetchAudiosIdsBySource = async (playlist: baseTypes.TTitlePlaylist): Promise<Array<baseTypes.TAudioTuple>> => {

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

    return parsedData.payload[1][0].map((trackInfo: Record<string, string>) => {
        return [trackInfo.audio_raw_id, trackInfo.access_key] as baseTypes.TAudioTuple;
    });
};
