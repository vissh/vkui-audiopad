import { useQuery } from '@tanstack/react-query'
import { fetchGeneral } from '../api/fetchers'

const queryName = 'general'

export const useGeneralData = (userId: string, enabled: boolean) => {
  return useQuery({
    queryKey: [queryName],
    queryFn: async () => await fetchGeneral(userId),
    refetchOnWindowFocus: false,
    enabled: userId.length > 0 && enabled,
    retry: 2
  })
}
