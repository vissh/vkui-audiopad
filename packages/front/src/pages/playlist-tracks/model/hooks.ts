import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseTypes } from "@vk-audiopad/common";
import { fetchMorePlaylistTracks, fetchPlaylist } from "shared/api";
import { TFetchPlaylistResult } from "shared/types";

const queryName = "blockPlaylist";

export const useBlockPlaylistData = (userId: string, playlist: baseTypes.TTitlePlaylist, fromId: string) => {
    return useQuery({
        queryKey: [queryName, playlist.id],
        queryFn: () => {
            if (playlist.tracks.length > 0) {
                return { playlist: playlist }
            }

            return fetchPlaylist({
                fromId: fromId,
                playlist: playlist,
            })
        },
        refetchOnWindowFocus: false,
        enabled: !!userId,
        retry: 2,
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
        retry: 2,
    });
};
