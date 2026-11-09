import { Image } from '@vkontakte/vkui'
import { type FC } from 'react'
import { FollowIcon } from '@/features/follow-album'
import { EditPlaylistButton } from '@/features/manage-playlists'
import { PlayPlaylistButton } from '@/features/play-or-pause-album'
import { AlbumCell, AlbumStats } from '@/entities/album'
import { openPlaylistPage } from '@/shared/model'
import { type Album as AlbumType } from '@/shared/types'
import './Album.css'

interface AlbumProps {
  userId: string
  album: AlbumType
}

export const Album: FC<AlbumProps> = ({ userId, album }) => {
  const openAlbum = () => {
    openPlaylistPage(userId, album)
  }

  return (
    <AlbumCell
      album={album}
      overlay={
        <Image.Overlay
          className='vkap_album_actions'
          theme='dark'
          visibility='on-hover'
        >
          <>
            <FollowIcon album={album} />
            <EditPlaylistButton userId={userId} playlist={album} />
            <PlayPlaylistButton userId={userId} album={album} />
            <AlbumStats tracks={album.trackCount} plays={album.playCount} />
          </>
        </Image.Overlay>
      }
      onClick={openAlbum}
    />
  )
}
