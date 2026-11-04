import { initialState, type commonTypes } from '@vk-audiopad/common'
import { storage } from './storage'

export const applicationState: commonTypes.ApplicationState = Object.assign({}, initialState.Application)

let loading: Promise<void> | undefined

const applyChanges = (changes: Partial<commonTypes.ApplicationState>): void => {
  Object.assign(applicationState, Object.fromEntries(Object.entries(changes).map(([key, value]) => [
    key, value === undefined ? initialState.Application[key] : value
  ])))
}

export const loadState = (): Promise<void> => {
  loading ??= restoreState()
  return loading
}

const restoreState = async (): Promise<void> => {
  let loaded = false
  const duringLoad: Partial<commonTypes.ApplicationState> = {}
  storage.listen(changes => {
    if (loaded) applyChanges(changes)
    else Object.assign(duringLoad, changes)
  })
  applyChanges(await storage.load())
  applyChanges(duringLoad)
  loaded = true
  await chrome.action.setBadgeBackgroundColor({ color: '#0077FF' })
}
