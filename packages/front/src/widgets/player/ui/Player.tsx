import { Group, PanelHeader } from '@vkontakte/vkui'
import { type FC } from 'react'
import { CurrentTimeButton, CurrentTimeSlider } from '@/features/change-current-time'
import { VolumeSlider } from '@/features/change-volume'
import { NextButton } from '@/features/play-next-track'
import { PlayPauseButton } from '@/features/play-or-pause'
import { PreviousButton } from '@/features/play-previous-track'
import { usePlaybackError } from '@/entities/active-track'
import { Buttons } from './Buttons'
import { PlaybackErrorNotice } from './PlaybackErrorNotice'
import { TrackIcon } from './TrackIcon'
import { TrackInfo } from './TrackInfo'

export const Player: FC = () => {
  const playbackError = usePlaybackError()
  return (
    <>
      <PanelHeader
        before={
          <>
            <PlayPauseButton />
            <PreviousButton />
            <NextButton />
            <TrackIcon />
          </>
        }
        after={
          <>
            <CurrentTimeButton />
            <VolumeSlider />
            <Buttons />
          </>
        }
      >
        <Group mode='plain' style={{ marginLeft: '8px' }}>
          <TrackInfo />
          <CurrentTimeSlider />
        </Group>
      </PanelHeader>
      {playbackError != null && <PlaybackErrorNotice key={playbackError} error={playbackError} />}
    </>
  )
}
