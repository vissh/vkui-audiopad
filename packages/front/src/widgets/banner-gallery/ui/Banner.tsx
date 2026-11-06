import { Icon36PlaylistOutline } from '@vkontakte/icons'
import { HorizontalCell, Image } from '@vkontakte/vkui'
import { type FC } from 'react'
import { openPlaylistPage } from '@/shared/model'
import { type Album as AlbumType } from '@/shared/types'

interface BannerProps {
  userId: string
  album: AlbumType
}

export const Banner: FC<BannerProps> = ({ userId, album }) => {
  const openAlbum = () => {
    openPlaylistPage(userId, album)
  }

  return (
    <HorizontalCell
      size='auto'
      title={album.title}
      subtitle={album.authorName}
      extraSubtitle={album.infoLine}
      onClick={openAlbum}
    >
      <Image widthSize={350} heightSize={175} size={175} src={album.coverUrl} loading='lazy' alt='' fallbackIcon={<Icon36PlaylistOutline />} />
    </HorizontalCell>
  )
}
