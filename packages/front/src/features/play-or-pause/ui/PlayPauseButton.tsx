import { commonTypes } from '@vk-audiopad/common'
import { Icon28PauseCircle, Icon28PlayCircle } from '@vkontakte/icons'
import { IconButton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { usePlaybackRequested } from '@/entities/active-track'
import { sendMessage } from '@/shared/lib/send-message'

export const PlayPauseButton: FC = () => {
  const playbackRequested = usePlaybackRequested()

  return (
    <IconButton
      aria-label={playbackRequested ? 'Приостановить' : 'Воспроизвести'}
      hasHover={false}
      hasActive={false}
      activeMode='none'
      onClick={() => {
        sendMessage({
          target: commonTypes.MessageTarget.SERVICE_WORKER,
          type: commonTypes.MessageType.TOGGLE_PLAYBACK
        })
      }}
      style={{ height: 48 }}
    >
      {playbackRequested ? <Icon28PauseCircle /> : <Icon28PlayCircle />}
    </IconButton>
  )
}
