import { type FC } from 'react'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { AlbumGallery } from '@/widgets/album-list'
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
  return (isLoading && loadingBlock === 'tracks') || catalogBlock?.dataType === CatalogBlockDataType.TRACKS
    ? <TrackGallery
      mode={mode}
      isLoading={isLoading}
      userId={userId}
      playlist={catalogBlock?.dataType === CatalogBlockDataType.TRACKS ? catalogBlock?.playlist : null}
    />
    : <AlbumGallery
      mode={mode}
      isLoading={isLoading}
      title={catalogBlock?.title ?? ''}
      userId={userId}
      albums={catalogBlock?.albums}
      showAllLink={catalogBlock?.showAllLink}
    />
}
