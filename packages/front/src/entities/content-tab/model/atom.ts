import { commonTypes, initialState } from '@vk-audiopad/common'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'
import { newHistory } from '../lib/utils'

export const selectedTabAtom = storageAtom({
  key: 'selectedTab',
  initial: initialState.InitialSelectedTab.selectedTab,
  default: initialState.DefaultSelectedTab.selectedTab,
  compareObjects: (prevSelectedTab, newSelectedTab): boolean => {
    return (
      prevSelectedTab != null &&
      newSelectedTab != null &&
      prevSelectedTab.tab !== commonTypes.ContentTab.UNKNOWN &&
      prevSelectedTab.tab === newSelectedTab.tab
    )
  }
})

selectedTabAtom.watch(() => {
  window.scrollTo(0, 0)
})

export const useSelectedTab = () => {
  return useAtomValue(selectedTabAtom)
}

export const openSearchPage = (value: string) => {
  selectedTabAtom.set({ tab: commonTypes.ContentTab.SEARCH, value })
}

export const openArtistPage = (artist: commonTypes.TrackArtist) => {
  selectedTabAtom.set({
    tab: commonTypes.ContentTab.ARTIST,
    id: artist.id,
    name: artist.name,
    history: [{ tab: commonTypes.ContentTab.GENERAL }]
  })
}

export const openPlaylistPage = (userId: string, playlist: commonTypes.Playlist, cleanHistory: boolean = false) => {
  selectedTabAtom.set({
    tab: commonTypes.ContentTab.PLAYLIST,
    fromId: userId,
    playlist,
    history: cleanHistory ? [{ tab: commonTypes.ContentTab.GENERAL }] : newHistory(selectedTabAtom.get())
  })
}

export const openAlbumsPage = (title: string, showAllLink: string) => {
  selectedTabAtom.set({
    tab: commonTypes.ContentTab.ALBUMS,
    title,
    showAllLink,
    history: newHistory(selectedTabAtom.get())
  })
}
