import { Group } from '@vkontakte/vkui'
import { memo, useState } from 'react'
import { Navigation } from '@/widgets/navigation'
import { VKMix } from '@/widgets/vk-mix'
import { Content } from '@/shared/ui/content'
import { useGeneralData } from '../model/hooks'
import { HomeHighlights } from './HomeHighlights'

interface GeneralProps {
  userId: string
  active: boolean
}

export const General = memo(function General ({ userId, active }: GeneralProps) {
  const [needsFallback, setNeedsFallback] = useState(false)
  const { data: fetchResult } = useGeneralData(userId, active && needsFallback)

  return (
    <Content display={active}>
      <Group style={{ paddingBottom: 'unset' }}>
        <Navigation noPaddingBottom />
        <VKMix active={active} isPending={userId.length === 0} userId={userId} />
      </Group>

      <HomeHighlights userId={userId} active={active} existing={fetchResult?.blocks ?? []} onInitialError={setNeedsFallback} />
    </Content>
  )
})
