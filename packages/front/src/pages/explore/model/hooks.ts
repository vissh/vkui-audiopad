import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mergeCatalogBlocks } from '@/shared/lib/pagination'
import { fetchExplore, fetchMoreExplore } from '../api/fetchers'
import { type FetchMoreExploreArgs, type FetchExploreResult } from './types'

const queryKey = (userId: string) => ['explore', userId] as const

export const useExploreData = (userId: string, enabled: boolean) => {
  return useQuery({
    queryKey: queryKey(userId),
    queryFn: async ({ signal }) => await fetchExplore(userId, signal),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: userId.length > 0 && enabled,
    retry: 2
  })
}

export const useLoadMoreExploreDataMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: async (args: FetchMoreExploreArgs & { userId: string }) => await fetchMoreExplore(args),
    onSuccess: (result: FetchExploreResult, args): void => {
      queryClient.setQueryData<FetchExploreResult>(queryKey(args.userId), previous => {
        if (previous == null || previous.sectionId !== args.sectionId || previous.nextFrom !== args.nextFrom) return previous
        return { ...result, blocks: mergeCatalogBlocks(previous.blocks, result.blocks) }
      })
    },
    retry: false
  })
}
