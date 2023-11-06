import { baseTypes, vkFetch } from "@vk-audiopad/common";

export const vkApiRestore = async (track: baseTypes.TTrackItem): Promise<void> => {
    const [ownerId, audioId] = track.id.split('_');

    return await vkFetch("https://vk.com/al_audio.php?act=restore_audio", {
        act: "restore_audio",
        al: "1",
        aid: audioId,
        oid: ownerId,
        hash: track.restoreHash,
        track_code: track.trackCode,
    });
};
