import { Group } from '@vkontakte/vkui'
import { useEffect, useState, type FC } from 'react'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { VKMix } from '@/widgets/vk-mix'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useGeneralData, useLoadMoreGeneralDataMutation } from '../model/hooks'

interface GeneralProps {
  userId: string
  active: boolean
}

export const General: FC<GeneralProps> = ({ userId, active }) => {
  const [wasAlreadyOpen, setWasAlreadyOpen] = useState(active)

  const { data: fetchResult, isPending, error } = useGeneralData(userId, wasAlreadyOpen)
  const loadMoreMutation = useLoadMoreGeneralDataMutation()

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
      <Group style={{ paddingBottom: 'unset' }}>
        <Navigation noPaddingBottom />
        <VKMix isPending={isPending} />
      </Group>

      <Group>
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
