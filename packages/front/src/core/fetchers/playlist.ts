import { baseTypes, vkFetch, vkFetchUtils } from "@vk-audiopad/common";
import { TFetchPlaylistArgs, TFetchPlaylistResult } from "../types";

export const fetchPlaylist = async (fetchArgs: TFetchPlaylistArgs): Promise<TFetchPlaylistResult> => {

    if (fetchArgs.playlist.blockId) {
        const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_block_playlist", {
            al: "1",
            block_id: fetchArgs.playlist.blockId,
            start_from: "0",
        });

        return {
            playlist: vkFetchUtils.toTitlePlaylist(parsedData.payload[1][0]),
        }
    } else {
        const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_section", {
            access_hash: fetchArgs.playlist.accessHash,
            al: "1",
            claim: "0",
            from_id: fetchArgs.fromId,
            is_loading_all: "1",
            is_preload: "0",
            offset: "0",
            owner_id: fetchArgs.playlist.ownerId,
            playlist_id: fetchArgs.playlist.id,
            type: "playlist",
        });

        return {
            playlist: vkFetchUtils.toTitlePlaylist(parsedData.payload[1][0]),
        }
    }
};

export const fetchMorePlaylistTracks = async (playlist: baseTypes.TTitlePlaylist): Promise<TFetchPlaylistResult> => {
    const parsedData = await vkFetch("https://vk.com/al_audio.php?act=load_block_playlist",
        {
            al: "1",
            block_id: playlist.blockId,
            start_from: playlist.nextOffset,
        }
    );

    return {
        playlist: vkFetchUtils.toTitlePlaylist(parsedData.payload[1][0]),
    }
};
