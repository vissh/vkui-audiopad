import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchExplore, fetchMoreExplore } from '../api/fetchers'
import { type FetchExploreResult, type FetchMoreExploreArgs } from './types'

const queryKey: readonly string[] = ['explore']

export const useExploreData = (userId: string, enabled: boolean) => {
  return useQuery({
    queryKey,
    queryFn: async () => await fetchExplore(userId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: userId.length > 0 && enabled,
    retry: 2
  })
}

export const useLoadMoreExploreDataMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: FetchMoreExploreArgs) => await fetchMoreExplore(args),
    onSuccess: (fetchResult: FetchExploreResult): void => {
      const previousFetchResult = queryClient.getQueryData<FetchExploreResult>(queryKey)
      if (previousFetchResult != null) {
        fetchResult.blocks.unshift(...previousFetchResult.blocks)
        queryClient.setQueryData(queryKey, fetchResult)
      }
    },
    retry: 2
  })
}
