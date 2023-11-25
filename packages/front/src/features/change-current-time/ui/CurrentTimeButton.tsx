import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { Button } from '@vkontakte/vkui'
import { type FC } from 'react'
import { useCurrentPlaylist, useCurrentTime, useDuration, usePlayed } from '@/entities/active-track'
import { setDurationMode, useDurationMode } from '@/entities/controls'
import { Duration } from '@/shared/ui/duration'

export const CurrentTimeButton: FC = () => {
  const currentPlaylist = useCurrentPlaylist()
  const duration = useDuration()
  const currentTime = useCurrentTime()
  const played = usePlayed()
  const durationMode = useDurationMode()

  const timeLeft = durationMode === commonTypes.DurationMode.TIME_LEFT

  const time = timeLeft ? duration - currentTime : currentTime
  const value = commonUtils.toHHMMSS(time)

  return (
    <Button
      hasHover={false}
      mode='link'
      stretched
      style={{ width: '42px', color: 'var(--vkui--color_text_secondary)' }}
      onClick={() => {
        const mode = timeLeft ? commonTypes.DurationMode.TIME_PASSED : commonTypes.DurationMode.TIME_LEFT
        setDurationMode(mode)
      }}
      loading={((currentPlaylist?.isRadio) ?? false) ? (currentTime === 0) : (duration === 0) && played}
    >
      <Duration
        value={
          (duration !== 0) && currentPlaylist != null && !currentPlaylist.isRadio
            ? timeLeft
              ? '-' + value
              : value
            : commonUtils.toHHMMSS(currentTime)
        }
      />
    </Button>
  )
}
