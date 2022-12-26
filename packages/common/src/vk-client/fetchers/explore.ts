import { IExploreFetchData, ITitlePlaylist } from "../../types";
import { vkFetch } from "../client";
import { toTitlePlaylist } from "../utils";

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

    fetchPlaylistResult.playlists.forEach(playlist => {
        if (playlist.tracks.length > 0) {
            result.playlists.push(playlist);
        }
    });

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

        fetchPlaylistResult.playlists.forEach(playlist => {
            if (playlist.tracks.length > 0) {
                result.playlists.push(playlist);
            }
        });
    }

    return result;
}

type FetchPlaylistResult = {
    nextFrom: string;
    sectionId: string;
    playlists: ITitlePlaylist[];
};

function getFetchPlaylistResult(parsedData: any): FetchPlaylistResult {
    const payload = parsedData.payload[1][1];
    const playlists = payload?.playlists;

    let explorePlaylists: ITitlePlaylist[] = [];

    if (playlists?.length > 0) {
        playlists.forEach((playlist: any) => {
            if (playlist.list?.length > 0) {
                explorePlaylists.push(toTitlePlaylist(playlist));
            }
        });
    }
    console.log(payload);
    console.log(explorePlaylists);

    return {
        nextFrom: payload.nextFrom,
        sectionId: payload.sectionId,
        playlists: explorePlaylists,
    }
};
