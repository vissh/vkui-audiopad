import { Icon28SongOutline } from '@vkontakte/icons'
import { IconButton, Image } from '@vkontakte/vkui'
import { type FC } from 'react'
import { useActiveTrack } from '@/entities/active-track'

export const TrackIcon: FC = () => {
  const activeTrack = useActiveTrack()

  return (
    <IconButton
      hasHover={false}
      hasActive={false}
      style={{ height: 48, marginLeft: '8px' }}
    >
      {activeTrack != null && activeTrack.image.length > 0
        ? <Image src={activeTrack.image} />
        : <Image><Icon28SongOutline /></Image>
      }
    </IconButton>
  )
}
