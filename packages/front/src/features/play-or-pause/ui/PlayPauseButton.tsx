import { Icon28PauseCircle, Icon28PlayCircle } from '@vkontakte/icons'
import { IconButton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { setPlayed, usePlayed } from '@/entities/active-track'

export const PlayPauseButton: FC = () => {
  const played = usePlayed()

  return (
    <IconButton
      hasHover={false}
      onClick={() => { setPlayed(!played) }}
      style={{ height: 48 }}
    >
      {played ? <Icon28PauseCircle /> : <Icon28PlayCircle />}
    </IconButton>
  )
}
