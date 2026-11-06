import { Headline } from '@vkontakte/vkui'
import { type FC } from 'react'
import { SearchArtist } from '@/features/search-artist'
import { useActiveTrack } from '@/entities/active-track'
import { getText } from '@/shared/lib/cast-to-types'

export const TrackInfo: FC = () => {
  const activeTrack = useActiveTrack()
  const title = getText((activeTrack?.title ?? '').trim())

  return (
    <div className='vkap_player_track_info' aria-live='polite' aria-atomic='true'>
      {(activeTrack != null)
        ? <>
            <Headline level='1' className='vkap_player_track_title' Component='div'>{title}</Headline>
            <SearchArtist track={activeTrack} />
          </>
        : <Headline level='1' Component='div'>&ensp;</Headline>}
    </div>
  )
}
