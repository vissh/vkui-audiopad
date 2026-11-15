import { Icon28SongOutline } from '@vkontakte/icons'
import { Image } from '@vkontakte/vkui'
import { memo, type FC } from 'react'
import { useActiveTrack } from '@/entities/active-track'

export const TrackIcon: FC = () => {
  const activeTrack = useActiveTrack()

  return <Artwork src={activeTrack?.image ?? ''} />
}

const Artwork = memo(function Artwork ({ src }: { src: string }) {
  return (
    <Image size={48} src={src || undefined} alt=''>
      {src.length === 0 && <Icon28SongOutline />}
    </Image>
  )
})
