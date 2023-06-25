import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCoverPlaylists, fetchMoreCoverPlaylists } from "./fetchers";
import { TFetchCoverPlaylistsResult, TFetchNextSectionArgs } from "./types";

const queryKeyName = "coverPlaylists";

export const useCoverPlaylistsData = (showAllLink: string) => {
    return useQuery({
        queryKey: makeQueryKey(showAllLink),
        queryFn: () => fetchCoverPlaylists(showAllLink),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 2,
    });
};

export const useLoadMoreCoverPlaylistsDataMutation = (showAllLink: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (args: TFetchNextSectionArgs) => fetchMoreCoverPlaylists(args),
        onSuccess: (fetchResult: TFetchCoverPlaylistsResult): void => {
            const queryKey = makeQueryKey(showAllLink);
            const previousData = queryClient.getQueryData<TFetchCoverPlaylistsResult>(queryKey);

            if (previousData) {
                fetchResult.coverPlaylists.unshift(...previousData.coverPlaylists);
                queryClient.setQueryData(queryKey, fetchResult);
            }
        },
        retry: 2,
    });
};

const makeQueryKey = (showAllLink: string): string[] => {
    return [queryKeyName, showAllLink];
};
