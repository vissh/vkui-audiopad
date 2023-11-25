import { Icon36Add, Icon36Done } from '@vkontakte/icons'
import { type FC } from 'react'
import { atom, useAtom } from '@/shared/lib/atom'
import { type Album } from '@/shared/types'
import { vkApiFollow } from '../api/follow'

const followedAlbumsAtom = atom<Record<string, boolean | undefined>>({})

interface FollowIconProps {
  album: Album
}

export const FollowIcon: FC<FollowIconProps> = ({ album }) => {
  const [followedAlbums, setFollowedAlbums] = useAtom(followedAlbumsAtom)

  const followed = followedAlbums[album.id] ?? album.isFollowed

  const follow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const followed = await vkApiFollow(album)
    setFollowedAlbums({ ...followedAlbums, [album.id]: followed })
  }

  return (
    <>
      {album.followHash.length !== 0 && !followed && (
        <Icon36Add
          className='vkap_cover_pl_act_btn'
          onClick={(e) => { void follow(e) }}
        />
      )}
      {followed && <Icon36Done
        className='vkap_cover_pl_act_btn'
        onClick={(e) => { void follow(e) }}
      />
      }
    </>
  )
}
