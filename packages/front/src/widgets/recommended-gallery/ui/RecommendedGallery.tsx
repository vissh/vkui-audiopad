import { CardScroll, Group, Header, Skeleton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { RecommendedPlaylist, RecommendedPlaylistSkeleton } from '@/entities/recommended-playlist'
import { openPlaylistPage } from '@/shared/model'
import { type Album } from '@/shared/types'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'

interface RecommendedGalleryProps {
  isPending: boolean
  title: string
  userId: string
  albums: Album[] | undefined
}

export const RecommendedGallery: FC<RecommendedGalleryProps> = ({ isPending, title, userId, albums = [] }) => {
  return (
    <SkeletonWrapper
      isPending={isPending}
      skeleton={<RecommendedGallerySkeleton />}
    >
      {albums.length > 0 && (
        <Group header={<Header>{title}</Header>}>
          <CardScroll size='s' padding>
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

const RecommendedGallerySkeleton: FC = () => {
  return (
    <Group header={<Header>{<Skeleton width={160} />}</Header>}>
      <CardScroll size='s' padding>
        {Array.from(Array(8).keys()).map((index) => (
          <RecommendedPlaylistSkeleton key={index} />
        ))}
      </CardScroll>
    </Group>
  )
}
