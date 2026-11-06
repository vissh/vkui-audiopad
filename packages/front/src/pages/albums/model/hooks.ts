import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAlbumsCatalogBlock } from '@/shared/lib/catalog-block'
import { mergeAlbums, mergeCatalogBlocks } from '@/shared/lib/pagination'
import { fetchAlbums, fetchMoreAlbums } from '../api/fetchers'
import { type FetchAlbumsResult, type FetchNextSectionArgs } from './types'

type MoreArgs = FetchNextSectionArgs & { userId: string, showAllLink: string }
const queryKey = (userId: string, showAllLink: string) => ['albums', userId, showAllLink] as const

export const useAlbumsData = (userId: string, showAllLink: string) => {
  return useQuery({
    queryKey: queryKey(userId, showAllLink),
    queryFn: async ({ signal }) => await fetchAlbums(showAllLink, signal),
    enabled: userId.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2
  })
}

export const useLoadMoreAlbumsDataMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: async (args: MoreArgs) => await fetchMoreAlbums(args),
    onSuccess: (result: FetchAlbumsResult, args): void => {
      queryClient.setQueryData<FetchAlbumsResult>(queryKey(args.userId, args.showAllLink), previous => {
        if (previous == null || previous.sectionId !== args.sectionId || previous.nextFrom !== args.nextFrom) return previous
        const [first] = previous.blocks
        const [next] = result.blocks
        const blocks = previous.blocks.length === 1 && result.blocks.length === 1 && isAlbumsCatalogBlock(first) && isAlbumsCatalogBlock(next)
          ? [{ ...next, albums: mergeAlbums(first.albums, next.albums) }]
          : mergeCatalogBlocks(previous.blocks, result.blocks)
        return { ...result, blocks }
      })
    },
    retry: false
  })
}
