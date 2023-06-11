import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseTypes } from "@vk-audiopad/common";
import { fetchMorePlaylistTracks } from "../../../core/fetchers/playlist";
import { TFetchPlaylistResult } from "../../../core/types";
import { fetchMyMusic } from "./fetchers";
import { TFetchMyMusicResult } from "./types";

const queryKey: ReadonlyArray<string> = ["myMusic"];

export const useMyMusicData = (userId: string) => {
    return useQuery({
        queryKey: queryKey,
        queryFn: () => fetchMyMusic(userId),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!userId,
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
    });
};
