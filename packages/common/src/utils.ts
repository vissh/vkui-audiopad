import { ApplicationControls, ApplicationSettings } from './initial-state'
import { type SelectedTabs, type TabWithHistory } from './types'

export const assertUnreachable = (_: never): never => {
  throw new Error('Statement should be unreachable')
}

export const isTabWithHistory = (tab: SelectedTabs): tab is TabWithHistory => {
  return 'history' in tab
}

export const toHHMMSS = (seconds: number): string => {
  const s = new Date(seconds * 1000).toISOString()
  const result = seconds < 3600 ? s.substring(14, 19) : s.substring(11, 16)
  return result.startsWith('0') ? result.slice(1, result.length) : result
}

const saveSettingsKeys = new Set([
  ...Object.keys(ApplicationControls),
  ...Object.keys(ApplicationSettings)
])

export const clearStorage = (saveCustomKeys?: string[]): void => {
  const saveKeys = saveCustomKeys == null ? saveSettingsKeys : new Set([...saveSettingsKeys, ...saveCustomKeys])

  chrome.storage.local.get((items) => {
    const removeKeys = Object.keys(items).filter(x => !saveKeys.has(x))
    void chrome.storage.local.remove(removeKeys)
  })
}
