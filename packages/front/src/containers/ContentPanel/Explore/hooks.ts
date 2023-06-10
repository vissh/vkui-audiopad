import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchExplore, fetchMoreExplore } from "./fetchers";
import { TFetchExploreResult, TFetchMoreExploreArgs } from "./types";

const queryKey: ReadonlyArray<string> = ["explore"];

export const useExploreData = (userId: string) => {
    return useQuery({
        queryKey: queryKey,
        queryFn: () => fetchExplore(userId),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!userId,
    });
};

export const useLoadMoreExploreDataMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (args: TFetchMoreExploreArgs) => fetchMoreExplore(args),
        onSuccess: (fetchResult: TFetchExploreResult): void => {
            const previousFetchResult = queryClient.getQueryData<TFetchExploreResult>(queryKey);
            if (previousFetchResult) {
                fetchResult.playlists.unshift(...previousFetchResult.playlists);
                queryClient.setQueryData(queryKey, fetchResult);
            }
        },
    });
};
