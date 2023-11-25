import { Headline } from '@vkontakte/vkui'
import { type CSSProperties, type FC } from 'react'
import { SearchArtist } from '@/features/search-artist'
import { useActiveTrack, useCurrentPlaylist } from '@/entities/active-track'

const maxTitleChars = 23

const trackNameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center'
}

export const TrackInfo: FC = () => {
  const activeTrack = useActiveTrack()
  const currentPlaylist = useCurrentPlaylist()

  let titleStyle: CSSProperties = {}

  const title = (activeTrack?.title ?? '').trim()

  if (!(currentPlaylist?.isRadio ?? false) && title.length >= maxTitleChars) {
    titleStyle = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: maxTitleChars - 5 + 'ch'
    }
  }

  return (
    <div style={trackNameStyle}>
      {(activeTrack != null)
        ? <>
          <Headline level='1' style={titleStyle}>{title}</Headline>
          <Headline>&ensp;–&ensp;</Headline>
          <SearchArtist track={activeTrack} />
        </>
        : <Headline level='1' style={titleStyle}>&ensp;</Headline>
      }
    </div>
  )
}
