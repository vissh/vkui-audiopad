import { baseTypes, vkFetch, vkFetchUtils } from "@vk-audiopad/common";

export const fetchAddTrack = async (track: baseTypes.TTrackItem): Promise<baseTypes.TTrackItem> => {
    const [ownerId, audioId] = track.id.split('_');
    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=add", {
        al: "1",
        audio_id: audioId,
        audio_owner_id: ownerId,
        from: "my",
        group_id: "0",
        hash: track.addHash,
        track_code: track.trackCode,
    });

    return vkFetchUtils.toTrackItem(jsonData.payload[1][0]);
};
