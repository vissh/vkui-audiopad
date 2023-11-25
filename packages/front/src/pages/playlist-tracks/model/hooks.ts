import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type commonTypes } from '@vk-audiopad/common'
import {
  fetchMorePlaylistTracks,
  fetchPlaylist,
  type FetchPlaylistResult
} from '@/shared/api'

const queryName = 'blockPlaylist'

export const useBlockPlaylistData = (
  userId: string,
  playlist: commonTypes.Playlist,
  fromId: string) => {
  return useQuery({
    queryKey: [queryName, playlist.id],
    queryFn: async () => {
      if (playlist.tracks.length > 0) {
        return { playlist }
      }

      return await fetchPlaylist({
        fromId,
        playlist
      })
    },
    refetchOnWindowFocus: false,
    enabled: !(userId.length === 0),
    retry: 2
  })
}

export const useLoadMoreBlockPlaylistTracksMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (playlist: commonTypes.Playlist) => await fetchMorePlaylistTracks(playlist),
    onSuccess: (fetchResult: FetchPlaylistResult): void => {
      const queryKey = [queryName, fetchResult.playlist.id]
      const previousFetchResult = queryClient.getQueryData<FetchPlaylistResult>(queryKey)
      if (previousFetchResult != null) {
        fetchResult.playlist.tracks.unshift(...previousFetchResult.playlist.tracks)
        queryClient.setQueryData(queryKey, fetchResult)
      }
    },
    retry: 2
  })
}
