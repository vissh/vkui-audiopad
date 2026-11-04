import { useQuery } from '@tanstack/react-query'
import { fetchWebToken } from '../lib/api'
import { updateWebToken } from '../lib/storage'

const queryKey: Readonly<string[]> = ['webToken']

export const useUpdateWebToken = () => {
  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const webToken = await fetchWebToken(signal)
      await updateWebToken(webToken, signal)
      return webToken
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false
  })
}
