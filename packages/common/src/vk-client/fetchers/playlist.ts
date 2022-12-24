import { ITitlePlaylist } from "../../types";
import { vkFetch } from "../client";
import { toTitlePlaylist } from "../utils";

export async function fetchPlaylistSection(playlist: ITitlePlaylist): Promise<ITitlePlaylist> {

    if (playlist.blockId) {
        const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_block_playlist",
            {
                al: "1",
                block_id: playlist.blockId,
                start_from: "0",
            });

        return toTitlePlaylist(parsedData.payload[1][0]);
    } else {
        const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_section",
            {
                access_hash: playlist.accessHash,
                al: "1",
                claim: "0",
                from_id: "8902548",
                is_loading_all: "1",
                is_preload: "0",
                offset: "0",
                owner_id: playlist.ownerId,
                playlist_id: playlist.id,
                type: "playlist",
            });

        return toTitlePlaylist(parsedData.payload[1][0]);
    }
}
