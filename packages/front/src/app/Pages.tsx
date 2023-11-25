import { commonTypes } from '@vk-audiopad/common'
import { type FC } from 'react'
import { Albums } from '@/pages/albums'
import { ArtistResult } from '@/pages/artist'
import { CurrentPlaylist } from '@/pages/current-playlist'
import { Explore } from '@/pages/explore'
import { General } from '@/pages/general'
import { MyMusic } from '@/pages/my-music'
import { PlaylistTracks } from '@/pages/playlist-tracks'
import { SearchResult } from '@/pages/search-result'
import { useActiveTab } from '@/entities/active-tab'
import { useSessionUserId } from '@/entities/session'

export const Pages: FC = () => {
  const userId = useSessionUserId()
  const activeTab = useActiveTab()

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

      {activeTab.tab === commonTypes.ContentTab.SEARCH &&
        <SearchResult
          userId={userId}
          searchValue={activeTab.value}
        />
      }
      {activeTab.tab === commonTypes.ContentTab.ALBUMS &&
        <Albums
          userId={userId}
          showAllLink={activeTab.showAllLink}
        />
      }
      {activeTab.tab === commonTypes.ContentTab.PLAYLIST &&
        <PlaylistTracks
          userId={userId}
          playlist={activeTab.playlist}
          fromId={activeTab.fromId}
        />
      }
      {activeTab.tab === commonTypes.ContentTab.ARTIST &&
        <ArtistResult
          userId={userId}
          artistId={activeTab.id}
          artistName={activeTab.name}
        />
      }
    </>
  )
}
