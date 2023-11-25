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
import { useSelectedTab } from '@/entities/content-tab'
import { useSessionUserId } from '@/entities/session'

export const Pages: FC = () => {
  const userId = useSessionUserId()
  const selectedTab = useSelectedTab()

  return (
    <>
      <CurrentPlaylist
        active={selectedTab.tab === commonTypes.ContentTab.CURRENT_PLAYLIST}
      />

      <General
        userId={userId}
        active={selectedTab.tab === commonTypes.ContentTab.GENERAL}
      />

      <MyMusic
        userId={userId}
        active={selectedTab.tab === commonTypes.ContentTab.MY_MUSIC}
      />

      <Explore
        userId={userId}
        active={selectedTab.tab === commonTypes.ContentTab.EXPLORE}
      />

      {selectedTab.tab === commonTypes.ContentTab.SEARCH &&
        <SearchResult
          userId={userId}
          searchValue={selectedTab.value}
        />
      }
      {selectedTab.tab === commonTypes.ContentTab.ALBUMS &&
        <Albums
          userId={userId}
          showAllLink={selectedTab.showAllLink}
        />
      }
      {selectedTab.tab === commonTypes.ContentTab.PLAYLIST &&
        <PlaylistTracks
          userId={userId}
          playlist={selectedTab.playlist}
          fromId={selectedTab.fromId}
        />
      }
      {selectedTab.tab === commonTypes.ContentTab.ARTIST &&
        <ArtistResult
          userId={userId}
          artistId={selectedTab.id}
          artistName={selectedTab.name}
        />
      }
    </>
  )
}
