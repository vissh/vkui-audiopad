import { Group, Spacing } from '@vkontakte/vkui'
import { type FC } from 'react'
import { AlbumList } from '@/widgets/album-list'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { isAlbumsCatalogBlock } from '@/shared/lib/catalog-block'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useAlbumsData, useLoadMoreAlbumsDataMutation } from '../model/hooks'

interface AlbumsProps {
  userId: string
  showAllLink: string
}

export const Albums: FC<AlbumsProps> = ({ userId, showAllLink }) => {
  const { data: fetchResult, isLoading, error } = useAlbumsData(showAllLink)
  const loadMoreMutation = useLoadMoreAlbumsDataMutation(showAllLink)

  const [firstBlock, ...otherBlocks] = fetchResult?.blocks ?? [null, null, null]
  const albumsBlock = isAlbumsCatalogBlock(firstBlock) && otherBlocks.length === 0 ? firstBlock : null

  return (
    <InfinityContent
      display={true}
      hasMore={(fetchResult?.nextFrom ?? '').length > 0}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
      error={error}
    >
      <Group>
        <Navigation />

        {isLoading || albumsBlock != null
          ? <>
            <Spacing />
            <AlbumList
              isLoading={isLoading}
              userId={userId}
              albums={albumsBlock?.albums}
            />
          </>
          : <CatalogGallery
            mode='plain'
            isLoading={isLoading}
            loadingBlock='albums'
            userId={userId}
            catalogBlock={firstBlock}
          />
        }
      </Group>

      {otherBlocks.map((catalogBlock) => (
        <CatalogGallery
          key={catalogBlock?.blockId}
          mode='card'
          isLoading={isLoading}
          loadingBlock='albums'
          userId={userId}
          catalogBlock={catalogBlock}
        />
      ))}
    </InfinityContent>
  )
}
