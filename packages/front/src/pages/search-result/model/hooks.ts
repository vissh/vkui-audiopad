import { useQuery } from '@tanstack/react-query'
import { fetchSearchTracks } from '../api/fetchers'

const queryName = 'search'

export const useSearchData = (userId: string, value: string) => {
  return useQuery({
    queryKey: [queryName, userId, value],
    queryFn: async () => await fetchSearchTracks({ ownerId: userId, value }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: userId.length !== 0 && value.length !== 0,
    retry: 2
  })
}
