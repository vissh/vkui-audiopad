import { HorizontalCell } from '@vkontakte/vkui'
import { type CSSProperties, type FC } from 'react'
import { openPlaylistPage } from '@/shared/model'
import { type Album as AlbumType } from '@/shared/types'

const largeImageStyles: CSSProperties = {
  width: 350,
  height: 175,
  borderRadius: 4,
  boxSizing: 'border-box',
  border: 'var(--vkui--size_border--regular) solid var(--vkui--color_image_border_alpha)',
  objectFit: 'cover'
}

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
      style={{ display: 'block' }}
      size='l'
      header={album.title}
      subtitle={album.authorName}
      extraSubtitle={album.infoLine}
      onClick={openAlbum}
    >
      <img style={largeImageStyles} src={album.coverUrl} />
    </HorizontalCell>
  )
}
