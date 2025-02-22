import { commonUtils } from '@vk-audiopad/common'
import { type FC } from 'react'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { AlbumGallery } from '@/widgets/album-list'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { BannerGallery } from '@/widgets/banner-gallery'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { RecommendedGallery } from '@/widgets/recommended-gallery'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { TrackGallery } from '@/widgets/track-list'
import { CatalogBlockDataType, type CatalogBlock } from '@/shared/types'

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

  switch (catalogBlock.dataType) {
    case CatalogBlockDataType.TRACKS:
      return <TrackGallery
        mode={mode}
        isPending={isPending}
        userId={userId}
        playlist={catalogBlock.playlist}
      />
    case CatalogBlockDataType.ALBUMS:
      return <AlbumGallery
        mode={mode}
        isPending={isPending}
        title={catalogBlock.title}
        userId={userId}
        albums={catalogBlock.albums}
        showAllLink={catalogBlock.showAllLink}
      />
    case CatalogBlockDataType.RECOMMENDATIONS:
      return <RecommendedGallery
        isPending={isPending}
        title={catalogBlock.title}
        userId={userId}
        albums={catalogBlock.albums}
      />
    case CatalogBlockDataType.VIBES:
      return <AlbumGallery
        mode={mode}
        isPending={isPending}
        title={catalogBlock.title}
        userId={userId}
        albums={catalogBlock.albums}
        showAllLink={catalogBlock.showAllLink}
      />
    case CatalogBlockDataType.BANNERS:
      return <BannerGallery
        userId={userId}
        albums={catalogBlock.albums}
      />
    default:
      commonUtils.assertUnreachable(catalogBlock)
  }
}
