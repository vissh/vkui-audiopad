import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseTypes, tabTypes } from "@vk-audiopad/common";
import { fetchMorePlaylistTracks, fetchPlaylist } from "../../../core/fetchers/playlist";
import { TFetchPlaylistResult } from "../../../core/types";

const queryName = "blockPlaylist";

export const useBlockPlaylistData = (selectedTab: tabTypes.TSelectedPlaylist) => {
    return useQuery({
        queryKey: [queryName, selectedTab.playlist.id],
        queryFn: () => fetchPlaylist({
            fromId: selectedTab.fromId,
            playlist: selectedTab.playlist,
        }),
        refetchOnWindowFocus: false,
    });
};

export const useLoadMoreBlockPlaylistTracksMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (playlist: baseTypes.TTitlePlaylist) => fetchMorePlaylistTracks(playlist),
        onSuccess: (fetchResult: TFetchPlaylistResult): void => {
            const queryKey = [queryName, fetchResult.playlist.id];
            const previousFetchResult = queryClient.getQueryData<TFetchPlaylistResult>(queryKey);
            if (previousFetchResult) {
                fetchResult.playlist.tracks.unshift(...previousFetchResult.playlist.tracks);
                queryClient.setQueryData(queryKey, fetchResult);
            }
        },
    });
};
