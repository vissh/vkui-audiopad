import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mergeCatalogBlocks } from '@/shared/lib/pagination'
import { fetchGeneral, fetchMore } from '../api/fetchers'
import { type FetchMoreArgs, type FetchResult } from './types'

const queryKey = (userId: string) => ['general', userId] as const

export const useGeneralData = (userId: string, enabled: boolean) => {
  return useQuery({
    queryKey: queryKey(userId),
    queryFn: async ({ signal }) => await fetchGeneral(userId, signal),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: userId.length > 0 && enabled,
    retry: 2
  })
}

export const useLoadMoreGeneralDataMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: async (args: FetchMoreArgs & { userId: string }) => await fetchMore(args),
    onSuccess: (result: FetchResult, args): void => {
      queryClient.setQueryData<FetchResult>(queryKey(args.userId), previous => {
        if (previous == null || previous.sectionId !== args.sectionId || previous.nextFrom !== args.nextFrom) return previous
        return { ...result, blocks: mergeCatalogBlocks(previous.blocks, result.blocks) }
      })
    },
    retry: false
  })
}
