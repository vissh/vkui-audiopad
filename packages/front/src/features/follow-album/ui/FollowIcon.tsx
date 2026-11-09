import { useQueryClient } from '@tanstack/react-query'
import { vkPlaylists, type commonTypes } from '@vk-audiopad/common'
import { Icon36Add, Icon36Done } from '@vkontakte/icons'
import { type FC } from 'react'
import { useSessionUserId } from '@/entities/session'
import { atom, useAtomValue } from '@/shared/lib/atom'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { vkApiFollow } from '../api/follow'

const followedAlbumsAtom = atom<Record<string, vkPlaylists.PlaylistFollowResult | undefined>>({})
const pendingAlbumsAtom = atom(new Set<string>())

interface FollowIconProps {
  album: commonTypes.Playlist
}

export const FollowIcon: FC<FollowIconProps> = ({ album }) => {
  const userId = useSessionUserId()
  const client = useQueryClient()
  const followedAlbums = useAtomValue(followedAlbumsAtom)
  const pendingAlbums = useAtomValue(pendingAlbumsAtom)
  const key = JSON.stringify([userId, album.ownerId, album.id])
  const followed = followedAlbums[key]?.followed ?? album.isFollowed

  const follow = async (): Promise<void> => {
    if (pendingAlbumsAtom.get().has(key)) return
    pendingAlbumsAtom.set(new Set([...pendingAlbumsAtom.get(), key]))
    try {
      const source = { ...album, followedPlaylist: followedAlbums[key]?.followedPlaylist ?? album.followedPlaylist }
      const next = album.followHash.length > 0 ? { followed: await vkApiFollow(album) } : await vkPlaylists.setFollowed(userId, source, !followed)
      followedAlbumsAtom.set({ ...followedAlbumsAtom.get(), [key]: next })
      void client.invalidateQueries({ queryKey: ['ownedPlaylists', userId] })
      void client.invalidateQueries({ queryKey: ['audioCatalog', userId] })
      void client.invalidateQueries({ queryKey: ['myMusic', userId] })
    } finally {
      const pending = new Set(pendingAlbumsAtom.get())
      pending.delete(key)
      pendingAlbumsAtom.set(pending)
    }
  }

  if (userId.length === 0 || (album.followHash.length === 0 && album.canFollow !== true && !followed)) return null
  return (
    <AsyncTooltipIconButton
      className='vkap_cover_pl_act_btn'
      accent
      text={followed ? 'Удалить плейлист из моей музыки' : 'Добавить плейлист в мою музыку'}
      icon={followed ? Icon36Done : Icon36Add}
      disabled={pendingAlbums.has(key)}
      onClick={follow}
      errorMessage='Не удалось изменить плейлист. Проверьте библиотеку VK перед повторной попыткой'
    />
  )
}
