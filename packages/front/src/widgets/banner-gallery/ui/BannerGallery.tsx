import { Group, HorizontalScroll } from '@vkontakte/vkui'
import { type FC } from 'react'
import { type Album as AlbumType } from '@/shared/types'
import { Banner } from './Banner'

interface BannerGalleryProps {
  userId: string
  albums: AlbumType[]
}

export const BannerGallery: FC<BannerGalleryProps> = ({ userId, albums }) => {
  return (
    <Group mode='plain'>
      <HorizontalScroll>
        {albums.map((album, albumIndex) => (
          <Banner
            key={albumIndex}
            userId={userId}
            album={album}
          />
        ))}
      </HorizontalScroll>
    </Group>
  )
}
