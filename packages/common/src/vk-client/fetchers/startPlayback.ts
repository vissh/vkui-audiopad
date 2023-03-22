import { TypeTrackItem } from "../../types";
import { vkFetch } from "../client";

export const startPlayback = async (track: TypeTrackItem, deviceId: string) => {
    const [ownerId, audioId] = track.id.split('_');
    await vkFetch("https://vk.com/al_audio.php?act=start_playback", {
        act: "start_playback",
        al: "1",
        audio_id: audioId,
        hash: track.actionHash,
        owner_id: ownerId,
        uuid: deviceId,
    });
};
