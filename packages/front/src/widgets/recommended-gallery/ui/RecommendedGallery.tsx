import { CardScroll, Group, Header } from '@vkontakte/vkui'
import { type FC } from 'react'
import { RecommendedPlaylist } from '@/entities/recommended-playlist'
import { openPlaylistPage } from '@/shared/model'
import { type Album } from '@/shared/types'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { RecommendedGallerySkeleton } from './RecommendedGallerySkeleton'

interface RecommendedGalleryProps {
  isLoading: boolean
  title: string
  userId: string
  albums: Album[] | undefined
}

export const RecommendedGallery: FC<RecommendedGalleryProps> = ({ isLoading, title, userId, albums = [] }) => {
  return (
    <SkeletonWrapper
      mode='card'
      isLoading={isLoading}
      skeleton={<RecommendedGallerySkeleton />}
    >
      {albums.length > 0 && (
        <Group header={<Header>{title}</Header>}>
          <CardScroll size='s'>
            {albums.map((album, cardIndex) => (
              <RecommendedPlaylist
                key={cardIndex}
                album={album}
                onClick={() => { openPlaylistPage(userId, album) }}
              />
            ))}
          </CardScroll>
        </Group>
      )}
    </SkeletonWrapper>
  )
}
