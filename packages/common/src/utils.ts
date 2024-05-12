import { ApplicationControls, ApplicationSettings } from './initial-state'
import { MessageType, type ActiveTabs, type Message, type TabWithHistory } from './types'

export const assertUnreachable = (_: never): never => {
  throw new Error('Statement should be unreachable')
}

export const isTabWithHistory = (tab: ActiveTabs): tab is TabWithHistory => {
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

export const isFirefox = (): boolean => {
  return false
}

let _offscreenDocumentSupport: boolean | null = null

export const offscreenDocumentSupport = async (): Promise<boolean> => {
  if (_offscreenDocumentSupport != null) {
    return _offscreenDocumentSupport
  }

  const env = await (await fetch(chrome.runtime.getURL('environment.json'))).json()
  _offscreenDocumentSupport = env['offscreen-document-support'] as boolean
  return _offscreenDocumentSupport
}

export const addBackgroundMessageListener = (handler: (message: Message) => void): void => {
  const customEventsElement = document.getElementById('custom-events')
  if (customEventsElement == null) {
    throw new Error('custom-events element not found')
  }
  Object.values(MessageType).forEach((eventName) => {
    customEventsElement.addEventListener(eventName, (event) => {
      if (isCustomEvent(event)) {
        handler(event.detail as Message)
      }
    })
  })
}

export const sendBackgroundMessage = (message: Message): void => {
  const customEventsElement = document.getElementById('custom-events')
  if (customEventsElement == null) {
    throw new Error('custom-events element not found')
  }
  customEventsElement.dispatchEvent(new CustomEvent(message.type, { detail: message }))
}

const isCustomEvent = (event: Event): event is CustomEvent => {
  return 'detail' in event
}
