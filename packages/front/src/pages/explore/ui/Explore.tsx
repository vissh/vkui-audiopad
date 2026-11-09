import { Group } from '@vkontakte/vkui'
import { memo, useState } from 'react'
import { CatalogFeed } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { Content } from '@/shared/ui/content'
import { useExploreData } from '../model/hooks'

interface ExploreProps {
  userId: string
  active: boolean
}

export const Explore = memo(function Explore ({ userId, active }: ExploreProps) {
  const [wasAlreadyOpen, setWasAlreadyOpen] = useState(active)
  if (active && !wasAlreadyOpen) {
    setWasAlreadyOpen(true)
  }

  const { data: fetchResult } = useExploreData(userId, wasAlreadyOpen)

  return (
    <Content display={active}>
      <Group>
        <Navigation />
      </Group>
      <CatalogFeed userId={userId} active={active} section='explore' existing={fetchResult?.blocks ?? []} />
    </Content>
  )
})
