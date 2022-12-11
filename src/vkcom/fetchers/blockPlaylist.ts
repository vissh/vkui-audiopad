import { IBlockPlaylistFetchData } from "../../types";
import { vkFetch } from "../client";
import { toTitlePlaylist } from "../utils";

export async function fetchBlockPlaylistSection(blockId: string): Promise<IBlockPlaylistFetchData> {

    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_block_playlist",
        {
            al: "1",
            block_id: blockId,
            start_from: "0",
        });

    return toTitlePlaylist(parsedData.payload[1][0]);
}
