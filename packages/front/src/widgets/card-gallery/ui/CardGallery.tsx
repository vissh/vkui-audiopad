import { CardScroll, Group, Header } from '@vkontakte/vkui'
import { type FC } from 'react'
import { CardCell } from '@/entities/card'
import { openPlaylistPage } from '@/entities/content-tab'
import { type Album } from '@/shared/types'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { CardGallerySkeleton } from './CardGallerySkeleton'

interface CardGalleryProps {
  isLoading: boolean
  title: string
  userId: string
  albums: Album[] | undefined
}

export const CardGallery: FC<CardGalleryProps> = ({ isLoading, title, userId, albums = [] }) => {
  return (
    <SkeletonWrapper
      mode='card'
      isLoading={isLoading}
      skeleton={<CardGallerySkeleton />}
    >
      {albums.length > 0 && (
        <Group header={<Header>{title}</Header>}>
          <CardScroll size='s'>
            {albums.map((album, cardIndex) => (
              <CardCell
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
