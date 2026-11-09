import { Card, Skeleton, Tappable, Text, Title } from '@vkontakte/vkui'
import { useState, type FC, type ReactNode } from 'react'
import { type Album } from '@/shared/types'
import './RecommendedPlaylist.css'

const width = '198px'
const height = '240px'

interface RecommendedPlaylistProps {
  album: Album
  onClick: () => void
  action: ReactNode
}

export const RecommendedPlaylist: FC<RecommendedPlaylistProps> = ({ album, onClick, action }) => {
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  return (
    <Card
      className={`vkap_recommended_playlist${keyboardFocus ? ' vkap_recommended_playlist_keyboard_focus' : ''}`}
      onFocusCapture={event => { setKeyboardFocus(event.target.matches(':focus-visible')) }}
      onBlurCapture={() => { setKeyboardFocus(false) }}
      onPointerDownCapture={() => { setKeyboardFocus(false) }}
      style={{
        backgroundImage: 'url(' + album.coverUrl + ')',
        backgroundSize: `${width} ${height}`,
        width,
        height,
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <Tappable Component='button' type='button' className='vkap_recommended_playlist_open' hoverMode='none' activeMode='none' onClick={event => { event.stopPropagation(); onClick() }}>
        <Title
          style={{
            margin: '16px 16px 12px',
            textAlign: 'left',
            fontSize: 28,
            lineHeight: '32px',
            color: 'white'
          }}
          level='1'
          weight='1'
          Component='span'
          useAccentWeight
        >
          {album.title}
        </Title>
        <Text
          style={{
            margin: '0 16px 48px',
            textAlign: 'left',
            fontSize: 14,
            lineHeight: '20px',
            color: 'white'
          }}
        >
          {album.authorLine}
        </Text>
      </Tappable>
      <div className='vkap_recommended_playlist_action'>{action}</div>
    </Card>
  )
}

export const RecommendedPlaylistSkeleton: FC = () => {
  return (
    <Card
      style={{
        backgroundSize: `${width} ${height}`,
        width,
        height
      }}
    >
      <Skeleton width={width} height={height} />
    </Card>
  )
}
