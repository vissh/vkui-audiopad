import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAlbumsCatalogBlock } from '@/shared/lib/catalog-block'
import { fetchAlbums, fetchMoreAlbums } from '../api/fetchers'
import { type FetchAlbumsResult, type FetchNextSectionArgs } from './types'

const queryKeyName = 'albums'

export const useAlbumsData = (showAllLink: string) => {
  return useQuery({
    queryKey: makeQueryKey(showAllLink),
    queryFn: async () => await fetchAlbums(showAllLink),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2
  })
}

export const useLoadMoreAlbumsDataMutation = (showAllLink: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: FetchNextSectionArgs) => await fetchMoreAlbums(args),
    onSuccess: (fetchResult: FetchAlbumsResult): void => {
      const queryKey = makeQueryKey(showAllLink)
      const previousData = queryClient.getQueryData<FetchAlbumsResult>(queryKey)

      if (previousData != null) {
        if (previousData.blocks.length === 1 && fetchResult.blocks.length === 1) {
          const previousAlbumsBlocks = previousData.blocks.filter(isAlbumsCatalogBlock)
          const newAlbumsBlocks = fetchResult.blocks.filter(isAlbumsCatalogBlock)
          if (previousAlbumsBlocks.length > 0 && newAlbumsBlocks.length > 0) {
            newAlbumsBlocks[0].albums.unshift(...previousAlbumsBlocks[0].albums)
          } else {
            fetchResult.blocks.unshift(...previousData.blocks)
          }
        } else {
          fetchResult.blocks.unshift(...previousData.blocks)
        }
        queryClient.setQueryData(queryKey, fetchResult)
      }
    },
    retry: 2
  })
}

const makeQueryKey = (showAllLink: string): string[] => {
  return [queryKeyName, showAllLink]
}
