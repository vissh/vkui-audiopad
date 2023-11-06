import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EPlaylistDataType, TAlbumsBlock, TPlaylistBlock } from "shared/types";
import { fetchAlbums, fetchMoreAlbums } from "../api/fetchers";
import { TFetchAlbumsResult, TFetchNextSectionArgs } from "./types";

const queryKeyName = "albums";

export const useAlbumsData = (showAllLink: string) => {
    return useQuery({
        queryKey: makeQueryKey(showAllLink),
        queryFn: () => fetchAlbums(showAllLink),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 2,
    });
};

export const useLoadMoreAlbumsDataMutation = (showAllLink: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (args: TFetchNextSectionArgs) => fetchMoreAlbums(args),
        onSuccess: (fetchResult: TFetchAlbumsResult): void => {
            const queryKey = makeQueryKey(showAllLink);
            const previousData = queryClient.getQueryData<TFetchAlbumsResult>(queryKey);

            if (previousData) {
                if (previousData.playlistBlocks.length === 1 && fetchResult.playlistBlocks.length === 1) {
                    const albumBlockFilter = (pb: TPlaylistBlock): pb is TAlbumsBlock => pb.dataType === EPlaylistDataType.ALBUMS;
                    const previousAlbumBlocks = previousData.playlistBlocks.filter(albumBlockFilter);
                    const albumBlocks = (fetchResult?.playlistBlocks || []).filter(albumBlockFilter);
                    albumBlocks[0].albums.unshift(...previousAlbumBlocks[0].albums);
                } else {
                    fetchResult.playlistBlocks.unshift(...previousData.playlistBlocks);
                }
                queryClient.setQueryData(queryKey, fetchResult);
            }
        },
        retry: 2,
    });
};

const makeQueryKey = (showAllLink: string): string[] => {
    return [queryKeyName, showAllLink];
};
