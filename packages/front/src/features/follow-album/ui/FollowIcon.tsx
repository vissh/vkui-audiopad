import { Icon36Add, Icon36Done } from '@vkontakte/icons'
import { type FC } from 'react'
import { useSessionUserId } from '@/entities/session'
import { atom, useAtomValue } from '@/shared/lib/atom'
import { type Album } from '@/shared/types'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { vkApiFollow } from '../api/follow'

const followedAlbumsAtom = atom<Record<string, boolean | undefined>>({})
const pendingAlbumsAtom = atom(new Set<string>())

interface FollowIconProps {
  album: Album
}

export const FollowIcon: FC<FollowIconProps> = ({ album }) => {
  const userId = useSessionUserId()
  const followedAlbums = useAtomValue(followedAlbumsAtom)
  const pendingAlbums = useAtomValue(pendingAlbumsAtom)
  const key = JSON.stringify([userId, album.ownerId, album.id])
  const followed = followedAlbums[key] ?? album.isFollowed

  const follow = async (): Promise<void> => {
    if (pendingAlbumsAtom.get().has(key)) return
    pendingAlbumsAtom.set(new Set([...pendingAlbumsAtom.get(), key]))
    try {
      const next = await vkApiFollow(album)
      followedAlbumsAtom.set({ ...followedAlbumsAtom.get(), [key]: next })
    } finally {
      const pending = new Set(pendingAlbumsAtom.get())
      pending.delete(key)
      pendingAlbumsAtom.set(pending)
    }
  }

  if (userId.length === 0 || (album.followHash.length === 0 && !followed)) return null
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
