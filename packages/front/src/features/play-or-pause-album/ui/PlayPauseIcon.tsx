import { Icon36Pause, Icon36Play } from '@vkontakte/icons'
import { type FC } from 'react'
import { setPlayed, useCurrentPlaylist, usePlayed } from '@/entities/active-track'
import { type Album } from '@/shared/types'

interface PlayPauseIconProps {
  album: Album
  onPlayNewAlbum: () => void
}

export const PlayPauseIcon: FC<PlayPauseIconProps> = ({ album, onPlayNewAlbum }) => {
  const currentPlaylist = useCurrentPlaylist()
  const played = usePlayed()

  const resumePauseAlbum = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPlayed(!played)
  }

  const playNewAlbum = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPlayNewAlbum()
  }

  return (
    <>
      {(currentPlaylist != null) && currentPlaylist.id === album.id
        ? played
          ? <Icon36Pause
            className='vkap_cover_pl_act_btn'
            onClick={resumePauseAlbum} />
          : <Icon36Play
            className='vkap_cover_pl_act_btn'
            onClick={resumePauseAlbum} />
        : <Icon36Play
          className='vkap_cover_pl_act_btn'
          onClick={playNewAlbum} />
      }
    </>
  )
}
