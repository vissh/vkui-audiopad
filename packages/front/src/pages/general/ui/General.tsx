import { Group } from '@vkontakte/vkui'
import { useState, type FC } from 'react'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { VKMix } from '@/widgets/vk-mix'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useGeneralData, useLoadMoreGeneralDataMutation } from '../model/hooks'
import { HomeHighlights } from './HomeHighlights'

interface GeneralProps {
  userId: string
  active: boolean
}

export const General: FC<GeneralProps> = ({ userId, active }) => {
  const [wasAlreadyOpen, setWasAlreadyOpen] = useState(active)
  if (active && !wasAlreadyOpen) {
    setWasAlreadyOpen(true)
  }

  const { data: fetchResult, isPending, error } = useGeneralData(userId, wasAlreadyOpen)
  const loadMoreMutation = useLoadMoreGeneralDataMutation()

  const [firstBlock, ...otherBlocks] = fetchResult?.blocks ?? [null, null, null]

  return (
    <InfinityContent
      display={active}
      hasMore={(fetchResult != null) ? fetchResult.nextFrom.length > 0 : false}
      paginationScope={JSON.stringify([userId, 'general', fetchResult?.sectionId])}
      pageKey={fetchResult?.nextFrom ?? ''}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={fetchResult == null ? undefined : { userId, nextFrom: fetchResult.nextFrom, sectionId: fetchResult.sectionId }}
      error={error}
    >
      <Group style={{ paddingBottom: 'unset' }}>
        <Navigation noPaddingBottom />
        <VKMix isPending={isPending} />
      </Group>

      {(isPending || firstBlock != null) && (
        <Group>
          <CatalogGallery
            mode='plain'
            isPending={isPending}
            loadingBlock='tracks'
            userId={userId}
            catalogBlock={firstBlock}
          />
        </Group>
      )}

      <HomeHighlights userId={userId} active={active} existing={fetchResult?.blocks ?? []} />

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
