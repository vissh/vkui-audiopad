import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type commonTypes } from '@vk-audiopad/common'
import { fetchMorePlaylistTracks, type FetchPlaylistResult } from '@/shared/api'
import { canAppendPlaylist, mergePlaylistPage } from '@/shared/lib/pagination'
import { fetchMyMusic } from '../api/fetchers'
import { type FetchMyMusicResult } from './types'

const queryKey = (userId: string) => ['myMusic', userId] as const

export const useMyMusicData = (userId: string, enabled: boolean) => {
  return useQuery({
    queryKey: queryKey(userId),
    queryFn: async ({ signal }) => await fetchMyMusic(userId, signal),
    refetchOnWindowFocus: false,
    enabled: userId.length > 0 && enabled,
    retry: 2
  })
}

export const useLoadMoreMyMusicTracksMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: async (args: { userId: string, playlist: commonTypes.Playlist }) => await fetchMorePlaylistTracks(args.playlist),
    onSuccess: (result: FetchPlaylistResult, args): void => {
      queryClient.setQueryData<FetchMyMusicResult>(queryKey(args.userId), previous => {
        if (previous == null) return previous
        const block = previous.lastTracksCatalogBlock
        if (block == null || !canAppendPlaylist(block.playlist, args.playlist, result.playlist)) return previous
        return { ...previous, lastTracksCatalogBlock: { ...block, playlist: mergePlaylistPage(block.playlist, result.playlist) } }
      })
    },
    retry: false
  })
}
