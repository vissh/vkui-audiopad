import { baseEnums, baseTypes, vkFetch, vkFetchUtils } from "@vk-audiopad/common";
import { unmaskUrl } from "./unmask";

export const fetchTrackInfo = async (ownerId: string, trackId: string, accessKey: string): Promise<baseTypes.TTrackItem> => {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=reload_audios", {
        al: "1",
        audio_ids: trackId + "_" + accessKey,
    });

    const trackInfo: Array<any> = parsedData.payload[1][0][0];
    const track = vkFetchUtils.toTrackItem(trackInfo);
    track.url = unmaskUrl(trackInfo[baseEnums.EAudioTupleIndex.URL], ownerId);
    return track;
};
