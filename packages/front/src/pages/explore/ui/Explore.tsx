import { Group } from '@vkontakte/vkui'
import { memo } from 'react'
import { CatalogFeed } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { Content } from '@/shared/ui/content'
import { useExploreData } from '../model/hooks'

interface ExploreProps {
  userId: string
  active: boolean
}

export const Explore = memo(function Explore ({ userId, active }: ExploreProps) {
  const { data: fetchResult, isError, refetch } = useExploreData(userId, active)

  return (
    <Content display={active}>
      <Group>
        <Navigation />
      </Group>
      <CatalogFeed userId={userId} active={active} section='explore' progressive existing={fetchResult?.blocks ?? []} onRetry={() => { if (isError) void refetch() }} />
    </Content>
  )
})
