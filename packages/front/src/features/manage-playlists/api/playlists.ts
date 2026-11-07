import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { vkPlaylists } from '@vk-audiopad/common'

const key = (userId: string) => ['ownedPlaylists', userId] as const

export const useOwnedPlaylists = (userId: string, enabled = true) => useInfiniteQuery({
  queryKey: key(userId),
  initialPageParam: 0,
  queryFn: async ({ pageParam, signal }) => await vkPlaylists.getPlaylists(userId, pageParam, signal),
  getNextPageParam: page => page.nextOffset,
  enabled: userId.length > 0 && enabled,
  networkMode: 'always',
  retry: false,
  refetchOnWindowFocus: false
})

export const useRefreshPlaylists = (userId: string) => {
  const client = useQueryClient()
  return () => {
    void client.invalidateQueries({ queryKey: key(userId) })
    void client.invalidateQueries({ queryKey: ['myMusic', userId] })
    void client.invalidateQueries({ queryKey: ['blockPlaylist', userId] })
  }
}
