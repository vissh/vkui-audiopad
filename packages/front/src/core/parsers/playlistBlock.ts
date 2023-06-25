import { baseTypes } from "@vk-audiopad/common";
import { EPlaylistDataType } from "../types/enums";
import { TCoverPlaylist, TCoverPlaylistBlock, TPlaylistBlock, TTrackPlaylistBlock } from "../types/playlists";
import { toCoverPlaylist, toTitlePlaylist } from "../utils";
import { findPlaylistBlocks } from "./htmlBlock";
import { THtmlPlaylistBlock } from "./types";

export const getPlaylistBlocks = (
    jsonData: any,
): TPlaylistBlock[] => {

    const playlists = jsonData.payload[1][1].playlists;
    const blockIds: string[] = jsonData.payload[1][1].blockIds;
    const html = jsonData.payload[1][0];

    const playlistBlocks = findPlaylistBlocks(blockIds, html);

    const trackPlaylists = Array.from(playlists)
        .filter((playlist: any) => !!playlist.list?.length)
        .reduce((result: Record<string, baseTypes.TTitlePlaylist>, playlist: any) => {
            result[playlist.blockId] = toTitlePlaylist(playlist);
            return result;
        }, {});

    const coverPlaylists = Array.from(playlists)
        .reduce((result: Record<string, TCoverPlaylist>, playlist: any) => {
            const playlistId = `${playlist.ownerId}_${playlist.id}`;
            result[playlistId] = toCoverPlaylist(playlist);
            return result;
        }, {});

    return playlistBlocks.map((x) => (
        x.dataType === EPlaylistDataType.TRACKS
            ? toTrackPlaylistBlock(x, trackPlaylists)
            : toCoverPlaylistBlock(x, coverPlaylists)
    ));
};

const toTrackPlaylistBlock = (
    htmlPlaylistBlock: THtmlPlaylistBlock,
    trackPlaylists: Record<string, baseTypes.TTitlePlaylist>,
): TTrackPlaylistBlock => {
    return {
        dataType: EPlaylistDataType.TRACKS,
        playlist: trackPlaylists[htmlPlaylistBlock.blockId],
    };
};

const toCoverPlaylistBlock = (
    htmlPlaylistBlock: THtmlPlaylistBlock,
    coverPlaylists: Record<string, TCoverPlaylist>,
): TCoverPlaylistBlock => {

    const blockId = htmlPlaylistBlock.blockId;
    const title = htmlPlaylistBlock.title;

    return {
        dataType: EPlaylistDataType.PLAYLISTS,
        title: title,
        blockId: blockId,
        playlists: htmlPlaylistBlock.coverPlaylists.map((pl) => {
            const coverPlaylist = coverPlaylists[pl.id];
            coverPlaylist.blockId = blockId;
            coverPlaylist.infoLine = pl.subtitle;
            return coverPlaylist;
        }),
        showAllLink: htmlPlaylistBlock.showAllLink,
    };
};
