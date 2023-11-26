import { Group, HorizontalScroll } from '@vkontakte/vkui'
import { type FC } from 'react'
import { openAlbumsPage } from '@/shared/model'
import { type Album as AlbumType } from '@/shared/types'
import { ShowAllLink } from '@/shared/ui/show-all-link'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Album } from '../album/Album'
import { AlbumGallerySkeleton } from './AlbumGallerySkeleton'

interface AlbumGalleryProps {
  mode: 'plain' | 'card'
  isLoading: boolean
  userId: string
  title: string
  albums: AlbumType[] | undefined
  showAllLink: string | undefined
}

export const AlbumGallery: FC<AlbumGalleryProps> = ({
  mode,
  isLoading,
  userId,
  title,
  albums = [],
  showAllLink = ''
}) => {
  return (
    <SkeletonWrapper
      mode={mode}
      isLoading={isLoading}
      skeleton={<AlbumGallerySkeleton />}
    >
      {albums.length > 0 && (
        <Group
          mode={mode}
          header={
            <ShowAllLink
              title={title}
              showLink={showAllLink.length !== 0}
              onClick={() => { openAlbumsPage(title, showAllLink) }}
            />
          }
        >
          <HorizontalScroll>
            <div style={{ display: 'flex' }}>
              {albums.map((album, albumIndex) => (
                <Album
                  key={albumIndex}
                  userId={userId}
                  album={album}
                />
              ))}
            </div>
          </HorizontalScroll>
        </Group>
      )}
    </SkeletonWrapper>
  )
}
