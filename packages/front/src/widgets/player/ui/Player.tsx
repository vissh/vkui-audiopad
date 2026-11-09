import { PanelHeader } from '@vkontakte/vkui'
import { type FC } from 'react'
import { CastToStatusButton } from '@/features/cast-to-status'
import { CurrentTimeButton, CurrentTimeSlider } from '@/features/change-current-time'
import { VolumeControl } from '@/features/change-volume'
import { NextButton } from '@/features/play-next-track'
import { PlayPauseButton } from '@/features/play-or-pause'
import { PreviousButton } from '@/features/play-previous-track'
import { RepeatButton } from '@/features/repeat'
import { ShuffleButton } from '@/features/shuffle'
import { usePlaybackError } from '@/entities/active-track'
import { Buttons } from './Buttons'
import { PlaybackErrorNotice } from './PlaybackErrorNotice'
import { TrackIcon } from './TrackIcon'
import { TrackInfo } from './TrackInfo'
import './Player.css'

export const Player: FC = () => {
  const playbackError = usePlaybackError()
  return (
    <>
      <PanelHeader
        id='vkap-player'
        role='region'
        aria-label='Музыкальный плеер'
        tabIndex={-1}
        className='vkap_player'
        before={
          <div className='vkap_player_leading'>
            <div className='vkap_player_controls'>
              <div className='vkap_player_transport' role='group' aria-label='Воспроизведение'>
                <PreviousButton />
                <PlayPauseButton />
                <NextButton />
              </div>
              <div className='vkap_player_action_group' role='group' aria-label='Режимы воспроизведения'>
                <ShuffleButton />
                <RepeatButton />
              </div>
            </div>
            <TrackIcon />
          </div>
        }
        after={
          <div className='vkap_player_action_group vkap_player_sound' role='group' aria-label='Звук и трансляция'>
            <VolumeControl />
            <CastToStatusButton />
          </div>
        }
      >
        <div className='vkap_player_content'>
          <div className='vkap_player_track_row'>
            <TrackInfo />
            <div className='vkap_player_track_actions'>
              <Buttons />
            </div>
            <div className='vkap_player_time'><CurrentTimeButton /></div>
          </div>
          <CurrentTimeSlider />
        </div>
      </PanelHeader>
      {playbackError != null && <PlaybackErrorNotice key={playbackError} error={playbackError} />}
    </>
  )
}
