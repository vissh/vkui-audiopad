import { type commonTypes } from '@vk-audiopad/common'
import { TabsItem } from '@vkontakte/vkui'
import { type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { getTabName } from '../lib/utils'
import { selectedTabAtom } from '../model/atom'

interface ContentTabProps {
  tab: commonTypes.ClickableContentTabs
}

export const ContentTab: FC<ContentTabProps> = ({ tab }) => {
  const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom)

  return (
    <TabsItem
      selected={selectedTab.tab === tab}
      id={'tab-' + tab}
      aria-controls={'tab-content-' + tab}
      onClick={() => { setSelectedTab({ tab }) }}
    >
      {getTabName({ tab })}
    </TabsItem>
  )
}
