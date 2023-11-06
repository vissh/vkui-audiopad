import { vkFetch } from "@vk-audiopad/common";
import { getPlaylistBlocks } from "shared/lib/parsers/playlist-block";
import { TPlaylistBlock } from "shared/types";
import { TFetchSearchArgs } from "../model/types";

export const fetchSearchTracks = async ({ ownerId, value }: TFetchSearchArgs): Promise<TPlaylistBlock[]> => {

    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=section", {
        act: "section",
        al: "1",
        claim: "0",
        is_layer: "0",
        owner_id: ownerId,
        q: value,
        section: "search",
    });

    return getPlaylistBlocks(jsonData);
};
