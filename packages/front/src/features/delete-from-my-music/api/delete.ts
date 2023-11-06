import { baseTypes, vkFetch } from "@vk-audiopad/common";


export const vkApiDelete = async (track: baseTypes.TTrackItem) => {
    await deleteTrack(track, false);
}

export const vkApiDeleteWithRestore = async (track: baseTypes.TTrackItem) => {
    await deleteTrack(track, true);
}

const deleteTrack = async (track: baseTypes.TTrackItem, restore: boolean): Promise<void> => {
    const [ownerId, audioId] = track.id.split('_');

    return await vkFetch("https://vk.com/al_audio.php?act=delete_audio", {
        act: "delete_audio",
        al: "1",
        aid: audioId,
        oid: ownerId,
        restore: restore ? "1" : "0",
        hash: track.deleteHash,
        track_code: track.trackCode,
    });
};

