import { Card, Skeleton, Text, Title } from '@vkontakte/vkui'
import { useState, type FC, type ReactNode } from 'react'
import { type Album } from '@/shared/types'
import './RecommendedPlaylist.css'

const width = '165px'
const height = '200px'

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
      <Title
        style={{
          marginBottom: 12,
          marginTop: 20,
          textAlign: 'center',
          color: 'white'
        }}
        level='1'
        weight='1'
        Component='h1'
        useAccentWeight
      >
        {album.title}
      </Title>
      <Text
        style={{
          marginBottom: 48,
          textAlign: 'center',
          color: 'white'
        }}
      >
        {album.authorLine}
      </Text>
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
