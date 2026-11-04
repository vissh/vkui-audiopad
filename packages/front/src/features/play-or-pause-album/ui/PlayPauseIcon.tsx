import { commonTypes } from '@vk-audiopad/common'
import { Icon36Pause, Icon36Play } from '@vkontakte/icons'
import { type FC } from 'react'
import { useCurrentPlaylist, usePlaybackRequested } from '@/entities/active-track'
import { sendMessage } from '@/shared/lib/send-message'
import { type Album } from '@/shared/types'

interface PlayPauseIconProps {
  album: Album
  onPlayNewAlbum: () => void
}

export const PlayPauseIcon: FC<PlayPauseIconProps> = ({ album, onPlayNewAlbum }) => {
  const currentPlaylist = useCurrentPlaylist()
  const playbackRequested = usePlaybackRequested()

  const resumePauseAlbum = (e: React.MouseEvent) => {
    e.stopPropagation()
    sendMessage({
      target: commonTypes.MessageTarget.SERVICE_WORKER,
      type: commonTypes.MessageType.TOGGLE_PLAYBACK
    })
  }

  const playNewAlbum = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPlayNewAlbum()
  }

  return (
    <>
      {(currentPlaylist != null) && currentPlaylist.id === album.id
        ? playbackRequested
          ? <Icon36Pause
              className='vkap_cover_pl_act_btn'
              onClick={resumePauseAlbum}
            />
          : <Icon36Play
              className='vkap_cover_pl_act_btn'
              onClick={resumePauseAlbum}
            />
        : <Icon36Play
            className='vkap_cover_pl_act_btn'
            onClick={playNewAlbum}
          />}
    </>
  )
}
