import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseTypes } from "@vk-audiopad/common";
import { fetchMorePlaylistTracks } from "shared/api";
import { TFetchPlaylistResult } from "shared/types";
import { fetchMyMusic } from "./fetchers";
import { TFetchMyMusicResult } from "./types";

const queryKey: ReadonlyArray<string> = ["myMusic"];

export const useMyMusicData = (userId: string) => {
    return useQuery({
        queryKey: queryKey,
        queryFn: () => fetchMyMusic(userId),
        refetchOnWindowFocus: false,
        enabled: !!userId,
        retry: 2,
    });
};

export const useLoadMoreMyMusicTracksMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (playlist: baseTypes.TTitlePlaylist) => fetchMorePlaylistTracks(playlist),
        onSuccess: (fetchResult: TFetchPlaylistResult): void => {
            const previousData = queryClient.getQueryData<TFetchMyMusicResult>(queryKey);
            if (previousData && previousData.playlist) {
                fetchResult.playlist.tracks.unshift(...previousData.playlist.tracks);
                previousData.playlist = fetchResult.playlist;
                queryClient.setQueryData(queryKey, previousData);
            }
        },
        retry: 2,
    });
};
