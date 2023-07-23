import { baseTypes, vkFetch } from "@vk-audiopad/common";

export const fetchRemoveTrack = async (track: baseTypes.TTrackItem): Promise<void> => {
    const [ownerId, audioId] = track.id.split('_');
    await vkFetch("https://vk.com/al_audio.php?act=delete_audio", {
        act: "delete_audio",
        al: "1",
        aid: audioId,
        oid: ownerId,
        restore: "1",
        hash: track.deleteHash,
        track_code: track.trackCode,
    });
};
