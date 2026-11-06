import { Icon28SongOutline } from '@vkontakte/icons'
import { Image } from '@vkontakte/vkui'
import { type FC } from 'react'
import { useActiveTrack } from '@/entities/active-track'

export const TrackIcon: FC = () => {
  const activeTrack = useActiveTrack()

  return (
    <Image size={48} src={activeTrack?.image || undefined} alt=''>
      {(activeTrack?.image.length ?? 0) === 0 && <Icon28SongOutline />}
    </Image>
  )
}
