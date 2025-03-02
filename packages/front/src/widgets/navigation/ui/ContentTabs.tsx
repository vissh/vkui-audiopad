import { commonTypes } from '@vk-audiopad/common'
import { Tabs, TabsItem } from '@vkontakte/vkui'
import { type FC } from 'react'
import { useCurrentPlaylist } from '@/entities/active-track'
import { setActiveTab, useActiveTab } from '@/shared/model'
import { getTabName } from '../lib/utils'

export const ContentTabs: FC = () => {
  const currentPlaylist = useCurrentPlaylist()
  const currentPlaylistExists = currentPlaylist != null && currentPlaylist.tracks.length > 0

  return (
    <Tabs mode='accent'>
      {currentPlaylistExists && <ContentTab tab={commonTypes.ContentTab.CURRENT_PLAYLIST} />}
      <ContentTab tab={commonTypes.ContentTab.GENERAL} />
      <ContentTab tab={commonTypes.ContentTab.MY_MUSIC} />
      <ContentTab tab={commonTypes.ContentTab.EXPLORE} />
    </Tabs>
  )
}

interface ContentTabProps {
  tab: commonTypes.ClickableContentTabs
}

const ContentTab: FC<ContentTabProps> = ({ tab }) => {
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
