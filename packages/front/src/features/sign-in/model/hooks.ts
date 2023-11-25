import { useQuery } from '@tanstack/react-query'
import { fetchWebToken } from '../lib/api'
import { updateWebToken } from '../lib/storage'

const queryKey: Readonly<string[]> = ['webToken']

export const useUpdateWebToken = () => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const webToken = await fetchWebToken()
      setTimeout(() => { updateWebToken(webToken) }, 1)
      return webToken
    },
    refetchOnWindowFocus: false,
    retry: 2
  })
}
