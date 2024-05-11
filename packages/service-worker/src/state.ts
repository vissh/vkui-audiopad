import { initialState, type commonTypes } from '@vk-audiopad/common'
import { storage } from './storage'

export const applicationState: commonTypes.ApplicationState = Object.assign({}, initialState.Application)

export const loadState = async (): Promise<void> => {
  const partialAppState = await storage.load()
  Object.assign(applicationState, partialAppState)

  if (applicationState.played) {
    await storage.played.set(false)
  }

  storage.listen((changes) => {
    Object.assign(applicationState, changes)
  })

  void chrome.action.setBadgeBackgroundColor({ color: '#0077FF' })
}
