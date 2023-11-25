import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { Tabs } from '@vkontakte/vkui'
import { memo, type FC } from 'react'
import { SearchInput } from '@/features/search'
import { useCurrentPlaylist } from '@/entities/active-track'
import { ContentTab, History, useSelectedTab } from '@/entities/content-tab'

interface NavigationProps {
  children?: React.ReactNode
}

export const Navigation: FC<NavigationProps> = ({ children }) => {
  const selectedTab = useSelectedTab()

  return (
    <>
      {commonUtils.isTabWithHistory(selectedTab) ? <History selectedTab={selectedTab} /> : <ContentTabs />}
      {children != null && children}
      {children == null && <SearchInput />}
    </>
  )
}

const ContentTabs = memo(function ContentTabs () {
  const currentPlaylist = useCurrentPlaylist()
  const currentPlaylistExists = currentPlaylist != null && currentPlaylist.tracks.length > 0

  return (
    <>
      <Tabs mode='accent'>
        {currentPlaylistExists && <ContentTab tab={commonTypes.ContentTab.CURRENT_PLAYLIST} />}
        <ContentTab tab={commonTypes.ContentTab.GENERAL} />
        <ContentTab tab={commonTypes.ContentTab.MY_MUSIC} />
        <ContentTab tab={commonTypes.ContentTab.EXPLORE} />
      </Tabs>
    </>
  )
})
