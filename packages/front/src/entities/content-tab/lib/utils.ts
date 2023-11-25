import { commonTypes, commonUtils } from '@vk-audiopad/common'

export const getTabName = (tab: commonTypes.SelectedTabs) => {
  switch (tab.tab) {
    case commonTypes.ContentTab.UNKNOWN:
      return 'UNKNOWN'
    case commonTypes.ContentTab.CURRENT_PLAYLIST:
      return 'Текущий плейлист'
    case commonTypes.ContentTab.GENERAL:
      return 'Главная'
    case commonTypes.ContentTab.MY_MUSIC:
      return 'Моя музыка'
    case commonTypes.ContentTab.EXPLORE:
      return 'Обзор'
    case commonTypes.ContentTab.SEARCH:
      return 'Результаты поиска'
    case commonTypes.ContentTab.PLAYLIST:
      return tab.playlist.title
    case commonTypes.ContentTab.ALBUMS:
      return tab.title
    case commonTypes.ContentTab.ARTIST:
      return tab.name
    default:
      return commonUtils.assertUnreachable(tab)
  }
}

export const newHistory = (tab: commonTypes.SelectedTabs): commonTypes.SelectedTabs[] => {
  return commonUtils.isTabWithHistory(tab) ? [...tab.history ?? [], tab] : [tab]
}
