import { IExploreFetchData, ITitlePlaylist } from "../../types";
import { vkFetch } from "../client";
import { getText, toTracksItems } from "../utils";

export async function fetchExploreSection(ownerId?: string): Promise<IExploreFetchData> {
    const result: IExploreFetchData = {
        playlists: [],
    };

    let fetchPlaylistResult = getFetchPlaylistResult(
        await vkFetch("https://vk.com/al_audio.php?act=section",
            {
                act: "section",
                al: "1",
                claim: "0",
                is_layer: "0",
                owner_id: "8902548",
                section: "explore",
            }
        )
    );

    if (fetchPlaylistResult.playlist && fetchPlaylistResult.playlist.tracks.length) {
        result.playlists.push(fetchPlaylistResult.playlist);
    }

    while (fetchPlaylistResult.nextFrom && fetchPlaylistResult.sectionId) {
        fetchPlaylistResult = getFetchPlaylistResult(
            await vkFetch("https://vk.com/al_audio.php?act=load_catalog_section",
                {
                    al: "1",
                    section_id: fetchPlaylistResult.sectionId,
                    start_from: fetchPlaylistResult.nextFrom,
                }
            )
        );

        if (fetchPlaylistResult.playlist && fetchPlaylistResult.playlist.tracks.length) {
            result.playlists.push(fetchPlaylistResult.playlist);
        }
    }

    return result;
}

type FetchPlaylistResult = {
    nextFrom: string;
    sectionId: string;
    playlist: ITitlePlaylist | null;
};

function getFetchPlaylistResult(parsedData: any): FetchPlaylistResult {
    const payload = parsedData.payload[1][1];
    const playlist = payload?.playlist;

    let explorePlaylist: ITitlePlaylist | null = null;

    if (playlist) {
        explorePlaylist = {
            id: playlist.id,
            blockId: playlist.blockId,
            nextOffset: playlist.nextOffset,
            hasMore: playlist.hasMore,

            title: getText(playlist.title),
            tracks: toTracksItems(playlist.list),
        };
    }

    return {
        nextFrom: payload.nextFrom,
        sectionId: payload.sectionId,
        playlist: explorePlaylist,
    }
};
