import { Group } from '@vkontakte/vkui'
import { useEffect, useState, type FC } from 'react'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useExploreData, useLoadMoreExploreDataMutation } from '../model/hooks'

interface ExploreProps {
  userId: string
  active: boolean
}

export const Explore: FC<ExploreProps> = ({ userId, active }) => {
  const [wasAlreadyOpen, setWasAlreadyOpen] = useState(active)

  const { data: fetchResult, isPending, error } = useExploreData(userId, wasAlreadyOpen)
  const loadMoreMutation = useLoadMoreExploreDataMutation()

  const [firstBlock, ...otherBlocks] = fetchResult?.blocks ?? [null, null, null]

  useEffect(() => {
    if (active) {
      setWasAlreadyOpen(true)
    }
  }, [active])

  return (
    <InfinityContent
      display={active}
      hasMore={(fetchResult != null) ? fetchResult.nextFrom.length > 0 : false}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={{ nextFrom: fetchResult?.nextFrom, sectionId: fetchResult?.sectionId }}
      error={error}
    >
      <Group>
        <Navigation />

        <CatalogGallery
          mode='plain'
          isPending={isPending}
          loadingBlock='tracks'
          userId={userId}
          catalogBlock={firstBlock}
        />
      </Group>

      {otherBlocks.map((catalogBlock) => (
        <CatalogGallery
          key={catalogBlock?.blockId}
          mode='card'
          isPending={isPending}
          loadingBlock='albums'
          userId={userId}
          catalogBlock={catalogBlock}
        />
      ))}
    </InfinityContent>
  )
}
