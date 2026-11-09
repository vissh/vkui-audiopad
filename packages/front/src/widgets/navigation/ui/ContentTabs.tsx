import { commonTypes } from '@vk-audiopad/common'
import { Tabs, TabsItem } from '@vkontakte/vkui'
import { useId, type FC } from 'react'
import { useCurrentPlaylist } from '@/entities/active-track'
import { setActiveTab, useActiveTab } from '@/shared/model'
import { getTabName } from '../lib/utils'

export const ContentTabs: FC = () => {
  const currentPlaylist = useCurrentPlaylist()
  const currentPlaylistExists = currentPlaylist != null && currentPlaylist.tracks.length > 0

  return (
    <Tabs mode='accent' aria-label='Разделы музыки'>
      {currentPlaylistExists && <ContentTab tab={commonTypes.ContentTab.CURRENT_PLAYLIST} />}
      <ContentTab tab={commonTypes.ContentTab.GENERAL} />
      <ContentTab tab={commonTypes.ContentTab.MY_MUSIC} />
      <ContentTab tab={commonTypes.ContentTab.EXPLORE} />
      <ContentTab tab={commonTypes.ContentTab.RADIO} />
    </Tabs>
  )
}

interface ContentTabProps {
  tab: commonTypes.ClickableContentTabs
}

const ContentTab: FC<ContentTabProps> = ({ tab }) => {
  const activeTab = useActiveTab()
  const id = useId()

  return (
    <TabsItem
      selected={activeTab.tab === tab}
      id={id}
      data-content-tab={tab}
      aria-controls={'tab-content-' + tab}
      onClick={() => { setActiveTab({ tab }) }}
    >
      {getTabName({ tab })}
    </TabsItem>
  )
}
