import { useMutation } from "@tanstack/react-query";
import { baseTypes } from "@vk-audiopad/common";
import { actions } from "../../../core/actions";
import { useSetAtom } from "../../../core/atom";
import { currentPlaylistAtom } from "../../../core/atoms/storage";
import { fetchMorePlaylistTracks } from "../../../core/fetchers/playlist";
import { TFetchPlaylistResult } from "../../../core/types";

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
    actions.editCurrentPlaylist(playlist, currentPlaylist, actions_);
};
