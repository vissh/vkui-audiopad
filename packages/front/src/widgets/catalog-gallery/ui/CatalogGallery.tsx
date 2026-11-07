import { commonUtils } from '@vk-audiopad/common'
import { Group } from '@vkontakte/vkui'
import { type FC } from 'react'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { AlbumGallery } from '@/widgets/album-list'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { BannerGallery } from '@/widgets/banner-gallery'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { RecommendedGallery } from '@/widgets/recommended-gallery'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { TrackGallery } from '@/widgets/track-list'
import { PlayCatalogButton } from '@/features/play-or-pause-album'
import { openAlbumsPage } from '@/shared/model'
import { CatalogBlockDataType, type CatalogBlock } from '@/shared/types'
import { CatalogTiles } from '@/shared/ui/catalog-tiles'
import { ShowAllLink } from '@/shared/ui/show-all-link'
import { ListeningGallery } from './ListeningGallery'

interface CatalogGalleryProps {
  mode: 'plain' | 'card'
  isPending: boolean
  loadingBlock: 'tracks' | 'albums'
  userId: string
  catalogBlock: CatalogBlock | undefined | null
}

export const CatalogGallery: FC<CatalogGalleryProps> = ({
  mode,
  isPending,
  loadingBlock,
  userId,
  catalogBlock
}) => {
  if (isPending || catalogBlock == null) {
    return loadingBlock === 'tracks'
      ? <TrackGallery mode={mode} isPending={isPending} userId={userId} playlist={null} />
      : <AlbumGallery mode={mode} isPending={isPending} title='' userId={userId} albums={undefined} showAllLink={undefined} />
  }

  if ('albums' in catalogBlock && catalogBlock.title.trim().toLocaleLowerCase('ru') === 'слушайте друг друга') {
    return <ListeningGallery userId={userId} title={catalogBlock.title} albums={catalogBlock.albums} showAllLink={catalogBlock.showAllLink} />
  }

  switch (catalogBlock.dataType) {
    case CatalogBlockDataType.TRACKS:
      return (
        <TrackGallery
          mode={mode}
          isPending={isPending}
          userId={userId}
          playlist={catalogBlock.playlist}
        />
      )
    case CatalogBlockDataType.ALBUMS:
      return (
        <AlbumGallery
          mode={mode}
          isPending={isPending}
          title={catalogBlock.title}
          userId={userId}
          albums={catalogBlock.albums}
          showAllLink={catalogBlock.showAllLink}
        />
      )
    case CatalogBlockDataType.RECOMMENDATIONS:
      return (
        <RecommendedGallery
          isPending={isPending}
          title={catalogBlock.title}
          userId={userId}
          albums={catalogBlock.albums}
        />
      )
    case CatalogBlockDataType.VIBES:
      return (
        <AlbumGallery
          mode={mode}
          isPending={isPending}
          title={catalogBlock.title}
          userId={userId}
          albums={catalogBlock.albums}
          showAllLink={catalogBlock.showAllLink}
        />
      )
    case CatalogBlockDataType.BANNERS:
      return (
        <BannerGallery
          userId={userId}
          albums={catalogBlock.albums}
          title={catalogBlock.title}
        />
      )
    case CatalogBlockDataType.LINKS:
      return (
        <Group mode={mode} header={<ShowAllLink title={catalogBlock.title} showLink={catalogBlock.showAllLink.length > 0} onClick={() => { openAlbumsPage(catalogBlock.title, catalogBlock.showAllLink) }} />}>
          <CatalogTiles items={catalogBlock.links} layout={catalogBlock.layout} onSelect={item => { openAlbumsPage(item.title, item.href) }} renderAction={catalogBlock.layout === 'categories' ? item => <PlayCatalogButton userId={userId} item={item} /> : undefined} />
        </Group>
      )
    default:
      commonUtils.assertUnreachable(catalogBlock)
  }
}
