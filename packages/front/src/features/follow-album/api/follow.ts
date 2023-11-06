import { baseTypes, vkFetch } from "@vk-audiopad/common";

export const vkApiFollow = async (playlist: baseTypes.TTitlePlaylist): Promise<boolean> => {
    const jsonData = await vkFetch("https://vk.com/al_audio.php?act=follow_playlist", {
        act: "follow_playlist",
        al: "1",
        block_id: playlist.blockId,
        hash: playlist.followHash,
        playlist_id: playlist.id,
        playlist_owner_id: playlist.ownerId,
        showcase: "0",
    });

    return jsonData.payload[1][0].is_followed;
};
