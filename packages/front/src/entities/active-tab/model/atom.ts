import { commonTypes, commonUtils, initialState } from '@vk-audiopad/common'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'

const activeTabAtom = storageAtom({
  key: 'activeTab',
  initial: initialState.InitialActiveTab.activeTab,
  default: initialState.DefaultActiveTab.activeTab,
  compareObjects: (prevActiveTab, newActiveTab): boolean => {
    return (
      prevActiveTab != null &&
      newActiveTab != null &&
      prevActiveTab.tab !== commonTypes.ContentTab.UNKNOWN &&
      prevActiveTab.tab === newActiveTab.tab
    )
  }
})

activeTabAtom.watch(() => {
  window.scrollTo(0, 0)
})

export const useActiveTab = () => {
  return useAtomValue(activeTabAtom)
}

export const setActiveTab = (tab: commonTypes.ActiveTabs): void => {
  activeTabAtom.set(tab)
}

export const onActiveTabChanged = (watcher: (activeTab: commonTypes.ActiveTabs) => void) => {
  activeTabAtom.watch(watcher)
}

export const openSearchPage = (value: string) => {
  setActiveTab({ tab: commonTypes.ContentTab.SEARCH, value })
}

export const openArtistPage = (artist: commonTypes.TrackArtist) => {
  setActiveTab({
    tab: commonTypes.ContentTab.ARTIST,
    id: artist.id,
    name: artist.name,
    history: [{ tab: commonTypes.ContentTab.GENERAL }]
  })
}

export const openPlaylistPage = (userId: string, playlist: commonTypes.Playlist, cleanHistory: boolean = false) => {
  setActiveTab({
    tab: commonTypes.ContentTab.PLAYLIST,
    fromId: userId,
    playlist,
    history: cleanHistory ? [{ tab: commonTypes.ContentTab.GENERAL }] : newHistory(activeTabAtom.get())
  })
}

export const openAlbumsPage = (title: string, showAllLink: string) => {
  setActiveTab({
    tab: commonTypes.ContentTab.ALBUMS,
    title,
    showAllLink,
    history: newHistory(activeTabAtom.get())
  })
}

const newHistory = (tab: commonTypes.ActiveTabs): commonTypes.ActiveTabs[] => {
  return commonUtils.isTabWithHistory(tab) ? [...tab.history ?? [], tab] : [tab]
}
