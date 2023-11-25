import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type commonTypes } from '@vk-audiopad/common'
import { fetchMorePlaylistTracks, type FetchPlaylistResult } from '@/shared/api'
import { fetchMyMusic } from '../api/fetchers'
import { type FetchMyMusicResult } from './types'

const queryKey: readonly string[] = ['myMusic']

export const useMyMusicData = (userId: string, enabled: boolean) => {
  return useQuery({
    queryKey,
    queryFn: async () => await fetchMyMusic(userId),
    refetchOnWindowFocus: false,
    enabled: userId.length > 0 && enabled,
    retry: 2
  })
}

export const useLoadMoreMyMusicTracksMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (playlist: commonTypes.Playlist) => await fetchMorePlaylistTracks(playlist),
    onSuccess: (fetchResult: FetchPlaylistResult): void => {
      const previousData = queryClient.getQueryData<FetchMyMusicResult>(queryKey)
      if ((previousData?.lastTracksCatalogBlock) != null) {
        fetchResult.playlist.tracks.unshift(...previousData.lastTracksCatalogBlock.playlist.tracks)
        previousData.lastTracksCatalogBlock.playlist = fetchResult.playlist
        queryClient.setQueryData(queryKey, previousData)
      }
    },
    retry: 2
  })
}
