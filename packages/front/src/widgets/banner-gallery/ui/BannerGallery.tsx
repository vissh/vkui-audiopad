import { Group } from '@vkontakte/vkui'
import { type FC } from 'react'
import { type Album as AlbumType } from '@/shared/types'
import { HorizontalScroll } from '@/shared/ui/horizontal-scroll'
import { ShowAllLink } from '@/shared/ui/show-all-link'
import { Banner } from './Banner'

interface BannerGalleryProps {
  userId: string
  albums: AlbumType[]
  title?: string
}

export const BannerGallery: FC<BannerGalleryProps> = ({ userId, albums, title = '' }) => {
  return (
    <Group mode='plain' header={title.length > 0 && <ShowAllLink title={title} showLink={false} onClick={() => {}} />}>
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
