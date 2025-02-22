import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { Div, Tabs } from '@vkontakte/vkui'
import { memo, type FC } from 'react'
import { SearchInput } from '@/features/search'
import { useCurrentPlaylist } from '@/entities/active-track'
import { useActiveTab } from '@/shared/model'
import { ContentTab } from './ContentTab'
import { History } from './History'

interface NavigationProps {
  children?: React.ReactNode
  noPaddingBottom?: boolean
}

export const Navigation: FC<NavigationProps> = ({ children, noPaddingBottom = false }) => {
  const activeTab = useActiveTab()

  return (
    <>
      {commonUtils.isTabWithHistory(activeTab) ? <History activeTab={activeTab} /> : <ContentTabs />}
      {children != null && children}
      {children == null && <Div
        style={{
          paddingTop: '8px',
          paddingBottom: noPaddingBottom ? 'unset' : '8px'
        }}>
        <SearchInput />
      </Div>}
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
