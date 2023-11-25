import { Div } from '@vkontakte/vkui'
import { type FC } from 'react'
import { type Album as AlbumType } from '@/shared/types'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Album } from '../album/Album'
import './AlbumList.css'
import { AlbumListSkeleton } from './AlbumListSkeleton'

interface AlbumListProps {
  isLoading: boolean
  userId: string
  albums: AlbumType[] | null | undefined
}

export const AlbumList: FC<AlbumListProps> = ({ isLoading, userId, albums }) => {
  return (
    <SkeletonWrapper
      mode='plain'
      isLoading={isLoading}
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
