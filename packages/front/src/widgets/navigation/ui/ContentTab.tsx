import { type commonTypes } from '@vk-audiopad/common'
import { TabsItem } from '@vkontakte/vkui'
import { type FC } from 'react'
import { setActiveTab, useActiveTab } from '@/shared/model'
import { getTabName } from '../lib/utils'

interface ContentTabProps {
  tab: commonTypes.ClickableContentTabs
}

export const ContentTab: FC<ContentTabProps> = ({ tab }) => {
  const activeTab = useActiveTab()

  return (
    <TabsItem
      selected={activeTab.tab === tab}
      id={'tab-' + tab}
      aria-controls={'tab-content-' + tab}
      onClick={() => { setActiveTab({ tab }) }}
    >
      {getTabName({ tab })}
    </TabsItem>
  )
}
