import { Icon36PlaylistOutline } from '@vkontakte/icons'
import { HorizontalCell, Image, Skeleton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { type Album } from '@/shared/types'
import './AlbumCell.css'

const size = 136

interface AlbumCellProps {
  album: Album
  overlay?: React.ReactNode
  onClick: () => void
}

export const AlbumCell: FC<AlbumCellProps> = ({ album, overlay, onClick }) => {
  return (
    <HorizontalCell
      style={{ display: 'block' }}
      size='l'
      header={<span className='vkap_subtitle'>{album.title}</span>}
      subtitle={<span className='vkap_subtitle'>{album.authorName}</span>}
      extraSubtitle={album.infoLine.length > 0 && <span className='vkap_subtitle'>{album.infoLine}</span>}
      onClick={onClick}
    >
      {/* TODO: GridAvatar или что-то подобное. Для ручных плейлистов бывает несколько обложек. */}
      {(album.coverUrl.length > 0)
        ? <Image src={album.coverUrl} loading={'lazy'} size={size}>{overlay}</Image>
        : <Image size={size}><Icon36PlaylistOutline /></Image>
      }
    </HorizontalCell>
  )
}

export const AlbumSkeleton: FC = () => {
  return (
    <HorizontalCell
      style={{ display: 'block' }}
      size='l'
      header={<Skeleton width={100} />}
      subtitle={<Skeleton width={75} />}
    >
      <Skeleton width={size} height={size} />
    </HorizontalCell>
  )
}
