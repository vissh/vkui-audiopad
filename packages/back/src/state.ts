import { initialState, type commonTypes } from '@vk-audiopad/common'
import { storage } from './storage'

declare global {
  interface Window {
    applicationState: commonTypes.ApplicationState
  }
}

export const applicationState: commonTypes.ApplicationState = Object.assign({}, initialState.Application)

window.applicationState = applicationState

document.addEventListener('DOMContentLoaded', () => {
  void (async () => {
    const partialAppState = await storage.load()
    Object.assign(applicationState, partialAppState)

    if (applicationState.played) {
      await storage.played.set(false)
    }

    storage.listen((changes) => {
      Object.assign(applicationState, changes)
    })

    void chrome.browserAction.setBadgeBackgroundColor({ color: '#0077FF' })
  })()
})
