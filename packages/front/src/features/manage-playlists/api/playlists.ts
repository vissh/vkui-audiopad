import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { vkPlaylists } from '@vk-audiopad/common'
import { catalogStaleTime } from '@/shared/api'

const key = (userId: string) => ['ownedPlaylists', userId] as const

export const useOwnedPlaylists = (userId: string, enabled = true, scope: 'owned' | 'library' = 'owned') => useInfiniteQuery({
  queryKey: [...key(userId), scope],
  initialPageParam: 0,
  queryFn: async ({ pageParam, signal }) => await vkPlaylists.getPlaylists(userId, pageParam, signal, scope),
  getNextPageParam: page => page.nextOffset,
  enabled: userId.length > 0 && enabled,
  networkMode: 'always',
  staleTime: catalogStaleTime,
  retry: false,
  refetchOnWindowFocus: false
})

export const useRefreshPlaylists = (userId: string) => {
  const client = useQueryClient()
  return () => {
    void client.invalidateQueries({ queryKey: key(userId) })
    void client.invalidateQueries({ queryKey: ['myMusic', userId] })
    void client.invalidateQueries({ queryKey: ['albums', userId] })
    void client.invalidateQueries({ queryKey: ['audioCatalog', userId] })
    void client.invalidateQueries({ queryKey: ['playlistEditor', userId] })
    void client.invalidateQueries({ queryKey: ['editablePlaylist', userId] })
    void client.invalidateQueries({ queryKey: ['blockPlaylist', userId] })
  }
}
