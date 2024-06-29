import { commonUtils } from '@vk-audiopad/common'
import { type FC } from 'react'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { AlbumGallery } from '@/widgets/album-list'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { RecommendedGallery } from '@/widgets/recommended-gallery'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { TrackGallery } from '@/widgets/track-list'
import { CatalogBlockDataType, type CatalogBlock } from '@/shared/types'

interface CatalogGalleryProps {
  mode: 'plain' | 'card'
  isLoading: boolean
  loadingBlock: 'tracks' | 'albums'
  userId: string
  catalogBlock: CatalogBlock | undefined | null
}

export const CatalogGallery: FC<CatalogGalleryProps> = ({
  mode,
  isLoading,
  loadingBlock,
  userId,
  catalogBlock
}) => {
  if (isLoading || catalogBlock == null) {
    return loadingBlock === 'tracks'
      ? <TrackGallery mode={mode} isLoading={isLoading} userId={userId} playlist={null} />
      : <AlbumGallery mode={mode} isLoading={isLoading} title='' userId={userId} albums={undefined} showAllLink={undefined} />
  }

  switch (catalogBlock.dataType) {
    case CatalogBlockDataType.TRACKS:
      return <TrackGallery
        mode={mode}
        isLoading={isLoading}
        userId={userId}
        playlist={catalogBlock.playlist}
      />
    case CatalogBlockDataType.ALBUMS:
      return <AlbumGallery
        mode={mode}
        isLoading={isLoading}
        title={catalogBlock.title}
        userId={userId}
        albums={catalogBlock.albums}
        showAllLink={catalogBlock.showAllLink}
      />
    case CatalogBlockDataType.RECOMMENDATIONS:
      return <RecommendedGallery
        isLoading={isLoading}
        title={catalogBlock.title}
        userId={userId}
        albums={catalogBlock.albums}
      />
    case CatalogBlockDataType.VIBES:
      return <AlbumGallery
        mode={mode}
        isLoading={isLoading}
        title={catalogBlock.title}
        userId={userId}
        albums={catalogBlock.albums}
        showAllLink={catalogBlock.showAllLink}
      />
    default:
      commonUtils.assertUnreachable(catalogBlock)
  }
}
