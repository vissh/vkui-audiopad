import { HorizontalCell, Skeleton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { type Album } from '@/shared/types'
import { MediaCover } from '@/shared/ui/media-cover'
import './AlbumCell.css'

const size = 128

interface AlbumCellProps {
  album: Album
  overlay?: React.ReactNode
  onClick: () => void
}

export const AlbumCell: FC<AlbumCellProps> = ({ album, overlay, onClick }) => {
  return (
    <HorizontalCell
      size='l'
      title={<span className='vkap_subtitle'>{album.title}</span>}
      subtitle={<span className='vkap_subtitle'>{album.authorName}</span>}
      extraSubtitle={album.infoLine.length > 0 && <span className='vkap_subtitle'>{album.infoLine}</span>}
      onClick={onClick}
    >
      <MediaCover images={album.gridCoverUrls.length > 1 ? album.gridCoverUrls : album.coverUrl.length > 0 ? [album.coverUrl] : []} size={size}>{overlay}</MediaCover>
    </HorizontalCell>
  )
}

export const AlbumSkeleton: FC = () => {
  return (
    <HorizontalCell
      size='l'
      title={<Skeleton width={110} />}
      subtitle={<Skeleton width={80} />}
    >
      <Skeleton width={size} height={size} />
    </HorizontalCell>
  )
}
