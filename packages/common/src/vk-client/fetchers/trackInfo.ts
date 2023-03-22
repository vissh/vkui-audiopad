import { TypeTrackItem } from "../../types";
import { vkFetch } from "../client";
import { EAudioTupleIndex } from "../enums";
import { unmaskUrl } from "../unmask";
import { toTrackItem } from "../utils";

export const trackInfo = async (ownerId: string, trackId: string, accessKey: string): Promise<TypeTrackItem> => {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=reload_audios", {
        al: "1",
        audio_ids: trackId + "_" + accessKey,
    });

    const trackInfo: Array<any> = parsedData.payload[1][0][0];
    const track = toTrackItem(trackInfo);
    track.url = unmaskUrl(trackInfo[EAudioTupleIndex.URL], ownerId);
    return track;
};
