import { commonTypes } from '@vk-audiopad/common'
import { useState, type FC, type ReactNode } from 'react'
import { Albums } from '@/pages/albums'
import { ArtistResult } from '@/pages/artist'
import { CurrentPlaylist } from '@/pages/current-playlist'
import { Explore } from '@/pages/explore'
import { General } from '@/pages/general'
import { MyMusic } from '@/pages/my-music'
import { PlaylistTracks } from '@/pages/playlist-tracks'
import { Radio } from '@/pages/radio'
import { SearchResult } from '@/pages/search-result'
import { useSessionUserId } from '@/entities/session'
import { PageActivityContext } from '@/shared/lib/page-activity'
import { useActiveTab } from '@/shared/model'

export const Pages: FC = () => {
  const userId = useSessionUserId()
  const activeTab = useActiveTab()

  return (
    <main id='vkap-content' tabIndex={-1} aria-label='Музыкальная библиотека'>
      <RetainedPage tab={commonTypes.ContentTab.CURRENT_PLAYLIST} label='Текущий плейлист' active={activeTab.tab === commonTypes.ContentTab.CURRENT_PLAYLIST}>
        <CurrentPlaylist
          active={activeTab.tab === commonTypes.ContentTab.CURRENT_PLAYLIST}
        />
      </RetainedPage>

      <RetainedPage tab={commonTypes.ContentTab.GENERAL} label='Главная' active={activeTab.tab === commonTypes.ContentTab.GENERAL}>
        <General
          userId={userId}
          active={activeTab.tab === commonTypes.ContentTab.GENERAL}
        />
      </RetainedPage>

      <RetainedPage tab={commonTypes.ContentTab.MY_MUSIC} label='Моя музыка' active={activeTab.tab === commonTypes.ContentTab.MY_MUSIC}>
        <MyMusic
          userId={userId}
          active={activeTab.tab === commonTypes.ContentTab.MY_MUSIC}
        />
      </RetainedPage>

      <RetainedPage tab={commonTypes.ContentTab.EXPLORE} label='Обзор' active={activeTab.tab === commonTypes.ContentTab.EXPLORE}>
        <Explore
          userId={userId}
          active={activeTab.tab === commonTypes.ContentTab.EXPLORE}
        />
      </RetainedPage>

      <RetainedPage tab={commonTypes.ContentTab.RADIO} label='Радио' active={activeTab.tab === commonTypes.ContentTab.RADIO}>
        <Radio userId={userId} active={activeTab.tab === commonTypes.ContentTab.RADIO} />
      </RetainedPage>

      {activeTab.tab === commonTypes.ContentTab.SEARCH &&
        <SearchResult
          userId={userId}
          searchValue={activeTab.value}
        />}
      {activeTab.tab === commonTypes.ContentTab.ALBUMS &&
        <Albums
          title={activeTab.title}
          userId={userId}
          showAllLink={activeTab.showAllLink}
        />}
      {activeTab.tab === commonTypes.ContentTab.PLAYLIST &&
        <PlaylistTracks
          userId={userId}
          playlist={activeTab.playlist}
          fromId={activeTab.fromId}
        />}
      {activeTab.tab === commonTypes.ContentTab.ARTIST &&
        <ArtistResult
          userId={userId}
          artistId={activeTab.id}
          artistName={activeTab.name}
        />}
    </main>
  )
}

const RetainedPage = ({ active, tab, label, children }: { active: boolean, tab: commonTypes.ClickableContentTabs, label: string, children: ReactNode }) => {
  const [opened, setOpened] = useState(active)
  if (active && !opened) setOpened(true)
  return <div id={'tab-content-' + tab} role='tabpanel' aria-label={label} hidden={!active} inert={!active}><PageActivityContext.Provider value={active}>{(active || opened) && children}</PageActivityContext.Provider></div>
}
