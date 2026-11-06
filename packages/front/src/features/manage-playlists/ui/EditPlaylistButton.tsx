import { useQuery } from '@tanstack/react-query'
import { vkPlaylists, type commonTypes } from '@vk-audiopad/common'
import { Icon24PenOutline } from '@vkontakte/icons'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { playlistDialogAtom } from '../model/dialog'

export const EditPlaylistButton = ({ userId, playlist }: { userId: string, playlist: commonTypes.Playlist }) => {
  const { data: owned } = useQuery({
    queryKey: ['editablePlaylist', userId, playlist.ownerId, playlist.id],
    queryFn: async ({ signal }) => await vkPlaylists.getPlaylist(userId, playlist.id, signal),
    enabled: userId.length > 0 && playlist.ownerId === userId,
    retry: false,
    networkMode: 'always',
    refetchOnWindowFocus: false
  })
  if (owned == null || playlist.ownerId !== userId) return null
  return <TooltipIconButton text='Редактировать плейлист' suppressTooltipOnClick icon={Icon24PenOutline} onClick={() => { playlistDialogAtom.set({ kind: 'edit', userId, playlist: owned }) }} />
}
