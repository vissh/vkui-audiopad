import { Footnote, HorizontalCell, Subhead, Tappable } from '@vkontakte/vkui'
import { type FC } from 'react'
import { type Album } from '@/shared/types'
import { LoadingPlaceholder as Skeleton } from '@/shared/ui/loading-placeholder'
import { MediaCover } from '@/shared/ui/media-cover'
import { AlbumAuthor } from './AlbumAuthor'
import './AlbumCell.css'

const size = 144

interface AlbumCellProps {
  album: Album
  overlay?: React.ReactNode
  onClick: () => void
}

export const AlbumCell: FC<AlbumCellProps> = ({ album, overlay, onClick }) => {
  return (
    <HorizontalCell
      Component='div'
      size={size + 20}
      noPadding
      className='vkap_album_cell'
      title={<Tappable Component='button' type='button' hoverMode='none' activeMode='none' className='vkap_album_title_button vkap_subtitle' onClick={event => { event.stopPropagation(); onClick() }}>{album.title}</Tappable>}
      subtitle={<AlbumAuthor name={album.authorName} avatarUrl={album.authorAvatarUrl} />}
      extraSubtitle={album.infoLine.length > 0 && <span className='vkap_subtitle'>{album.infoLine}</span>}
      onClick={onClick}
    >
      <MediaCover images={album.gridCoverUrls.length > 0 ? album.gridCoverUrls : album.coverUrl.length > 0 ? [album.coverUrl] : []} size={size}>{overlay}</MediaCover>
    </HorizontalCell>
  )
}

export const AlbumSkeleton: FC = () => (
  <div className='vkap_album_cell vkap_album_skeleton'>
    <div className='vkap_album_skeleton_cover'><Skeleton width={size} height={size} /></div>
    <div className='vkap_album_skeleton_text'>
      <Subhead Component='div'><Skeleton width={110} /></Subhead>
      <Footnote Component='div'><Skeleton width={80} /></Footnote>
    </div>
  </div>
)
