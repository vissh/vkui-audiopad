import { Image, Separator } from '@vkontakte/vkui'
import { type FC } from 'react'
import { FollowIcon } from '@/features/follow-album'
import { playOrPause } from '@/features/play-or-pause'
import { PlayPauseIcon } from '@/features/play-or-pause-album'
import { AlbumCell } from '@/entities/album'
import { fetchPlaylist } from '@/shared/api'
import { openPlaylistPage } from '@/shared/model'
import { type Album as AlbumType } from '@/shared/types'
import './Album.css'

interface AlbumProps {
  userId: string
  album: AlbumType
}

export const Album: FC<AlbumProps> = ({ userId, album }) => {
  const playNewAlbum = async () => {
    const playlistFetchResult = await fetchPlaylist({ fromId: userId, playlist: album })
    playOrPause('normal', 0, playlistFetchResult.playlist)
  }

  const openAlbum = () => {
    openPlaylistPage(userId, album)
  }

  return (
    <AlbumCell
      album={album}
      overlay={
        <Image.Overlay
          theme='dark'
          visibility='on-hover'
        >
          <>
            <FollowIcon album={album} />
            <Separator />
            <PlayPauseIcon
              album={album}
              onPlayNewAlbum={() => { void playNewAlbum() }}
            />
          </>
        </Image.Overlay>
      }
      onClick={openAlbum}
    />
  )
}
