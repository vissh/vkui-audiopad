import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type commonTypes } from '@vk-audiopad/common'
import { fetchMorePlaylistTracks, fetchPlaylist, type FetchPlaylistResult } from '@/shared/api'
import { canAppendPlaylist, mergePlaylistPage } from '@/shared/lib/pagination'

type MoreArgs = { userId: string, fromId: string, source: commonTypes.Playlist, playlist: commonTypes.Playlist }
const queryKey = (userId: string, source: commonTypes.Playlist, fromId: string) => ['blockPlaylist', userId, source.ownerId, source.id, source.blockId, fromId] as const

export const useBlockPlaylistData = (userId: string, playlist: commonTypes.Playlist, fromId: string) => {
  return useQuery({
    queryKey: queryKey(userId, playlist, fromId),
    queryFn: async ({ signal }) => playlist.tracks.length > 0 && (playlist.blockId === playlist.id || playlist.isRadio || playlist.isVkMix) ? { playlist } : await fetchPlaylist({ fromId, playlist }, signal),
    refetchOnWindowFocus: false,
    enabled: userId.length > 0,
    retry: 2
  })
}

export const useLoadMoreBlockPlaylistTracksMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: async (args: MoreArgs) => await fetchMorePlaylistTracks(args.playlist),
    onSuccess: (result: FetchPlaylistResult, args): void => {
      queryClient.setQueryData<FetchPlaylistResult>(queryKey(args.userId, args.source, args.fromId), previous => {
        if (previous == null || !canAppendPlaylist(previous.playlist, args.playlist, result.playlist)) return previous
        return { playlist: mergePlaylistPage(previous.playlist, result.playlist) }
      })
    },
    retry: false
  })
}
