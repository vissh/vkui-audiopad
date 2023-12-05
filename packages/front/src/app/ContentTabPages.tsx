import { type FC } from 'react'
import { commonTypes } from '@vk-audiopad/common'
import { Albums } from '@/pages/albums'
import { ArtistResult } from '@/pages/artist'
import { CurrentPlaylist } from '@/pages/current-playlist'
import { Explore } from '@/pages/explore'
import { General } from '@/pages/general'
import { MyMusic } from '@/pages/my-music'
import { PlaylistTracks } from '@/pages/playlist-tracks'
import { SearchResult } from '@/pages/search-result'
import { useSessionUserId } from '@/entities/session'
import { useActiveTab } from '@/shared/model'

export const ContentTabPages: FC = () => {
  const userId = useSessionUserId()
  const activeTab = useActiveTab()

  const tabs = {
    [commonTypes.ContentTab.SEARCH]: (
      <SearchResult
        userId={userId}
        searchValue={activeTab.value}
      />
    ),
    [commonTypes.ContentTab.ALBUMS]: (
      <Albums
        userId={userId}
        showAllLink={activeTab.showAllLink}
      />
    ),
    [commonTypes.ContentTab.PLAYLIST]: (
      <PlaylistTracks
        userId={userId}
        playlist={activeTab.playlist}
        fromId={activeTab.fromId}
      />
    ),
    [commonTypes.ContentTab.ARTIST]: (
      <ArtistResult
        userId={userId}
        artistId={activeTab.id}
        artistName={activeTab.name}
      />
    )
  }
  return (
    <>
      <CurrentPlaylist
        active={activeTab.tab === commonTypes.ContentTab.CURRENT_PLAYLIST}
      />

      <General
        userId={userId}
        active={activeTab.tab === commonTypes.ContentTab.GENERAL}
      />

      <MyMusic
        userId={userId}
        active={activeTab.tab === commonTypes.ContentTab.MY_MUSIC}
      />

      <Explore
        userId={userId}
        active={activeTab.tab === commonTypes.ContentTab.EXPLORE}
      />
      {tabs[activeTab.tab]}
    </>
  )
}
