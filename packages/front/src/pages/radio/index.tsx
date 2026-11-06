import { Group } from '@vkontakte/vkui'
import { memo } from 'react'
import { CatalogFeed } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'

export const Radio = memo(function Radio ({ userId, active }: { userId: string, active: boolean }) {
  return (
    <div hidden={!active} id='tab-content-radio'>
      <Group><Navigation /></Group>
      <CatalogFeed userId={userId} active={active} section='radiostations' />
    </div>
  )
})
