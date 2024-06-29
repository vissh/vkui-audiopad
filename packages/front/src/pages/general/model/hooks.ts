import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchGeneral, fetchMore } from '../api/fetchers'
import { type FetchMoreArgs, type FetchResult } from './types'

const queryKey = ['general']

export const useGeneralData = (userId: string, enabled: boolean) => {
  return useQuery({
    queryKey,
    queryFn: async () => await fetchGeneral(userId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: userId.length > 0 && enabled,
    retry: 2
  })
}

export const useLoadMoreGeneralDataMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: FetchMoreArgs) => await fetchMore(args),
    onSuccess: (fetchResult: FetchResult): void => {
      const previousFetchResult = queryClient.getQueryData<FetchResult>(queryKey)
      if (previousFetchResult != null) {
        fetchResult.blocks.unshift(...previousFetchResult.blocks)
        queryClient.setQueryData(queryKey, fetchResult)
      }
    },
    retry: 2
  })
}
