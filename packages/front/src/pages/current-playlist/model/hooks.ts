import { useMutation } from '@tanstack/react-query'
import { type commonTypes } from '@vk-audiopad/common'
import { setCurrentPlaylist } from '@/entities/active-track'
import { fetchMorePlaylistTracks, type FetchPlaylistResult } from '@/shared/api'

export const useLoadMorePlaylistTracksMutation = (currentPlaylist: commonTypes.Playlist | null) => {
  return useMutation({
    mutationFn: async (playlist: commonTypes.Playlist) => await fetchMorePlaylistTracks(playlist),
    onSuccess: (fetchResult: FetchPlaylistResult): void => {
      if (currentPlaylist != null) {
        fetchResult.playlist.tracks.unshift(...currentPlaylist.tracks)
        setCurrentPlaylist(fetchResult.playlist)
      }
    }
  })
}
