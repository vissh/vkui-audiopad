import { useMutation } from "@tanstack/react-query";
import { baseTypes } from "@vk-audiopad/common";
import { fetchMorePlaylistTracks } from "shared/api";
import { useSetAtom } from "shared/lib/atom";
import { currentPlaylistAtom } from "shared/model/storage-atoms";
import { TFetchPlaylistResult } from "shared/types";

export const useLoadMorePlaylistTracksMutation = (currentPlaylist: baseTypes.TTitlePlaylist | null) => {
    const setCurrentPlaylist = useSetAtom(currentPlaylistAtom);

    return useMutation({
        mutationFn: (playlist: baseTypes.TTitlePlaylist) => fetchMorePlaylistTracks(playlist),
        onSuccess: (fetchResult: TFetchPlaylistResult): void => {
            if (currentPlaylist) {
                fetchResult.playlist.tracks.unshift(...currentPlaylist.tracks);
                setCurrentPlaylist(fetchResult.playlist);
            }
        },
    });
};

export const applyEditedCurrentPlaylist = (
    playlist: baseTypes.TTitlePlaylist,
    currentPlaylist: baseTypes.TTitlePlaylist,
    actions_: Array<Array<any>>
) => {
    const setCurrentPlaylist = useSetAtom(currentPlaylistAtom);
    setCurrentPlaylist(playlist);

    chrome.runtime.sendMessage({
        type: "editCurrentPlaylist", data: {
            playlist: playlist,
            oldPlaylist: currentPlaylist,
            actions: actions_,
        }
    });
};
