import { useMutation } from '@tanstack/react-query'
import { commonTypes } from '@vk-audiopad/common'
import { fetchMorePlaylistTracks, type FetchPlaylistResult } from '@/shared/api'
import { sendMessage } from '@/shared/lib/send-message'

export const useLoadMorePlaylistTracksMutation = () => {
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: async (playlist: commonTypes.Playlist) => await fetchMorePlaylistTracks(playlist),
    onSuccess: (fetchResult: FetchPlaylistResult, basePlaylist: commonTypes.Playlist): void => {
      sendMessage({
        target: commonTypes.MessageTarget.SERVICE_WORKER,
        type: commonTypes.MessageType.APPEND_CURRENT_PLAYLIST,
        basePlaylist,
        playlist: fetchResult.playlist
      })
    }
  })
}
