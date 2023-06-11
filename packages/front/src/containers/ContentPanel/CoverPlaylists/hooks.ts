import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCoverPlaylists, fetchMoreCoverPlaylists } from "./fetchers";
import { TFetchCoverPlaylistsResult, TFetchNextSectionArgs } from "./types";

const queryKey: ReadonlyArray<string> = ["coverPlaylists"];

export const useCoverPlaylistsData = (userId: string) => {
    return useQuery({
        queryKey: queryKey,
        queryFn: () => fetchCoverPlaylists(userId),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!userId,
    });
};

export const useLoadMoreCoverPlaylistsDataMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (args: TFetchNextSectionArgs) => fetchMoreCoverPlaylists(args),
        onSuccess: (fetchResult: TFetchCoverPlaylistsResult): void => {
            const previousData = queryClient.getQueryData<TFetchCoverPlaylistsResult>(queryKey);

            if (previousData) {
                fetchResult.coverPlaylists.unshift(...previousData.coverPlaylists);
                queryClient.setQueryData(queryKey, fetchResult);
            }
        },
    });
};
