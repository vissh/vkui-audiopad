import { Icon28SongOutline, Icon32PauseCircle, Icon32PlayCircle } from '@vkontakte/icons'
import { Image } from '@vkontakte/vkui'
import { type FC } from 'react'
import { type TrackState } from '../model/types'

interface TrackImageProps {
  imageSrc: string
  trackState: TrackState
  showOverlay?: boolean
}

export const TrackImage: FC<TrackImageProps> = ({ imageSrc, trackState, showOverlay = true }) => {
  return (
    <Image
      src={imageSrc}
      loading={'lazy'}
    >
      {showOverlay &&
        <>
          <PlayPauseIcon trackState={trackState} />
          {(imageSrc.length === 0) && <Icon28SongOutline />}
        </>
      }
    </Image>
  )
}

interface PlayPauseIconProps {
  trackState: TrackState
}

const PlayPauseIcon: FC<PlayPauseIconProps> = ({ trackState }) => {
  return (
    <Image.Overlay
      theme={trackState === 'disabled' ? 'light' : 'dark'}
      visibility={
        trackState === 'played' || trackState === 'paused' || trackState === 'disabled' ? 'always' : 'on-hover'
      }
    >
      <>
        {trackState === 'played' && (
          <Icon32PauseCircle
            width={32}
            height={32}
            fill={'white'}
          />
        )}
        {(trackState === 'paused' || trackState === 'normal') && (
          <Icon32PlayCircle
            width={32}
            height={32}
            fill={'white'}
          />
        )}
      </>
    </Image.Overlay>
  )
}
