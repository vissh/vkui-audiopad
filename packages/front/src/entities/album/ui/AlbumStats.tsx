import { Icon12Articles, Icon12Headphones } from '@vkontakte/icons'
import './AlbumCell.css'

const formatCount = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}M`
  if (value >= 1_000) return `${(value / 1_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}K`
  return value.toLocaleString('ru-RU')
}

export const AlbumStats = ({ tracks, plays }: { tracks?: number, plays?: number }) => (
  <span className='vkap_album_stats'>
    {tracks != null && tracks >= 0 && <span aria-label={`Треков: ${tracks}`}><Icon12Articles />{formatCount(tracks)}</span>}
    {plays != null && plays >= 0 && <span aria-label={`Прослушиваний: ${plays}`}><Icon12Headphones />{formatCount(plays)}</span>}
  </span>
)
