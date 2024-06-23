import { Card, Skeleton, Text, Title } from '@vkontakte/vkui'
import { type FC } from 'react'
import { type Album } from '@/shared/types'

const width = '165px'
const height = '200px'

interface RecommendedPlaylistProps {
  album: Album
  onClick: () => void
}

export const RecommendedPlaylist: FC<RecommendedPlaylistProps> = ({ album, onClick }) => {
  return (
    <Card
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
