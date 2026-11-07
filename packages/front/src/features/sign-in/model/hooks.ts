import { useQuery } from '@tanstack/react-query'
import { fetchWebToken } from '../lib/api'

const queryKey: Readonly<string[]> = ['webToken']

export const useUpdateWebToken = () => {
  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      return await fetchWebToken(signal)
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false
  })
}
