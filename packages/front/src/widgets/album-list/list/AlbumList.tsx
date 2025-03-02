import { Flex } from '@vkontakte/vkui'
import { type FC } from 'react'
import { AlbumSkeleton } from '@/entities/album'
import { type Album as AlbumType } from '@/shared/types'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Album } from '../album/Album'

interface AlbumListProps {
  isPending: boolean
  userId: string
  albums: AlbumType[] | null | undefined
}

export const AlbumList: FC<AlbumListProps> = ({ isPending, userId, albums }) => {
  return (
    <SkeletonWrapper
      isPending={isPending}
      skeleton={<AlbumListSkeleton />}
    >
      {(albums != null) && albums.length > 0 && (
        <Flex>
          {albums.map((album) => (
            <Album
              key={album.id}
              userId={userId}
              album={album}
            />
          ))}
        </Flex>
      )}
    </SkeletonWrapper>
  )
}

const AlbumListSkeleton: FC = () => {
  return (
    <Flex>
      {Array.from(Array(8).keys()).map((index) => (
        <AlbumSkeleton key={index} />
      ))}
    </Flex>
  )
}
