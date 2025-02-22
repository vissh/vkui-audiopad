import { Div } from '@vkontakte/vkui'
import { type FC } from 'react'
import { AlbumSkeleton } from '@/entities/album'
import { type Album as AlbumType } from '@/shared/types'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Album } from '../album/Album'
import './AlbumList.css'

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
        <Div className='vkap_album_list_container'>
          {albums.map((album) => (
            <Album
              key={album.id}
              userId={userId}
              album={album}
            />
          ))}
        </Div>
      )}
    </SkeletonWrapper>
  )
}

const AlbumListSkeleton: FC = () => {
  return (
    <Div className='vkap_album_list_container'>
      {Array.from(Array(8).keys()).map((index) => (
        <AlbumSkeleton key={index} />
      ))}
    </Div>
  )
}
