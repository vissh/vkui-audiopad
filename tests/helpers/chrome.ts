import { vi } from 'vitest'

type StorageItems = Record<string, unknown>
type Changes = Record<string, chrome.storage.StorageChange>
type StorageKeys = string | string[] | StorageItems | null
type StorageCallback = (items: StorageItems) => void
type MessageListener = (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => unknown

const event = <T extends (...args: never[]) => unknown>() => {
  const listeners = new Set<T>()
  return {
    addListener: vi.fn((listener: T) => { listeners.add(listener) }),
    removeListener: vi.fn((listener: T) => { listeners.delete(listener) }),
    hasListener: (listener: T) => listeners.has(listener),
    emit: (...args: Parameters<T>) => [...listeners].map(listener => listener(...args))
  }
}

export const createChrome = (initial: StorageItems = {}) => {
  let items = structuredClone(initial)
  let nextStorageError: string | undefined
  let offscreenExists = false
  const changed = event<(changes: Changes, area: string) => void>()
  const messages = event<MessageListener>()
  const commands = event<(command: string) => void>()
  const sendMessageFrom = async (message: unknown, sender: chrome.runtime.MessageSender): Promise<unknown> => {
    return await new Promise((resolve, reject) => {
      let responded = false
      const respond = (value: unknown): void => {
        if (!responded) {
          responded = true
          resolve(structuredClone(value))
        }
      }
      const results = messages.emit(structuredClone(message), sender, respond)
      if (results.length === 0) return reject(new Error('Could not establish connection. Receiving end does not exist.'))
      let pending = false
      for (const result of results) {
        if (result === true) pending = true
        else if (result instanceof Promise) {
          pending = true
          result.then(respond, reject)
        } else if (result !== undefined && result !== false) respond(result)
      }
      if (!pending && !responded) resolve(undefined)
    })
  }
  const runtime = {
    id: 'test-extension',
    lastError: undefined as { message: string } | undefined,
    getURL: (path: string) => `chrome-extension://test-extension/${path}`,
    ContextType: { OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT' },
    getContexts: vi.fn(async (_filter: unknown) => offscreenExists ? [{ documentUrl: 'offscreen.html' }] : []),
    onMessage: messages,
    onInstalled: event<(details: chrome.runtime.InstalledDetails) => void>(),
    OnInstalledReason: { UPDATE: 'update' },
    setUninstallURL: vi.fn(async (_url: string) => {}),
    sendMessage: vi.fn(async (message: unknown) => await sendMessageFrom(message, { id: 'test-extension', url: 'chrome-extension://test-extension/index.html', documentId: 'test-document' }))
  }

  const operation = <T>(action: () => T, callback?: (result: T) => void): Promise<T> => {
    const failure = nextStorageError
    nextStorageError = undefined
    return new Promise((resolve, reject) => {
      queueMicrotask(() => {
        if (failure != null) {
          if (callback == null) {
            reject(new Error(failure))
          } else {
            runtime.lastError = { message: failure }
            try {
              callback(undefined as T)
              resolve(undefined as T)
            } finally {
              runtime.lastError = undefined
            }
          }
          return
        }
        const result = action()
        callback?.(result)
        resolve(result)
      })
    })
  }

  const select = (keys: StorageKeys): StorageItems => {
    if (keys == null) return structuredClone(items)
    const names = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys)
    return Object.fromEntries(names
      .filter(key => key in items || (typeof keys === 'object' && !Array.isArray(keys) && keys != null))
      .map(key => [key, structuredClone(key in items ? items[key] : (keys as StorageItems)[key])]))
  }

  const publish = (changes: Changes) => {
    if (Object.keys(changes).length > 0) {
      queueMicrotask(() => { changed.emit(structuredClone(changes), 'local') })
    }
  }
  const local = {
    get: vi.fn((keys: StorageKeys | StorageCallback = null, callback?: StorageCallback) => {
      return typeof keys === 'function'
        ? operation(() => select(null), keys)
        : operation(() => select(keys), callback)
    }),
    set: vi.fn((values: StorageItems, callback?: () => void) => {
      const copied = structuredClone(values)
      return operation(() => {
        const changes: Changes = {}
        for (const [key, newValue] of Object.entries(copied)) {
          if (JSON.stringify(items[key]) !== JSON.stringify(newValue)) {
            changes[key] = { newValue, ...(key in items ? { oldValue: items[key] } : {}) }
            items[key] = newValue
          }
        }
        publish(changes)
      }, callback)
    }),
    remove: vi.fn((keys: string | string[], callback?: () => void) => operation(() => {
      const changes: Changes = {}
      for (const key of typeof keys === 'string' ? [keys] : keys) {
        if (key in items) {
          changes[key] = { oldValue: items[key] }
          delete items[key]
        }
      }
      publish(changes)
    }, callback)),
    clear: vi.fn((callback?: () => void) => operation(() => {
      const changes = Object.fromEntries(Object.entries(items).map(([key, oldValue]) => [key, { oldValue }]))
      items = {}
      publish(changes)
    }, callback)),
    onChanged: changed
  }

  const api = {
    runtime,
    commands: { onCommand: commands },
    permissions: {
      contains: vi.fn((_permissions: unknown, onResult?: (allowed: boolean) => void) => {
        onResult?.(true)
        return Promise.resolve(true)
      })
    },
    action: { setBadgeText: vi.fn(async (_options: unknown) => {}), setBadgeBackgroundColor: vi.fn(async (_options: unknown) => {}) },
    storage: { local, onChanged: changed },
    offscreen: {
      Reason: { AUDIO_PLAYBACK: 'AUDIO_PLAYBACK', WORKERS: 'WORKERS' },
      createDocument: vi.fn(async (_options: unknown) => { offscreenExists = true }),
      closeDocument: vi.fn(async () => { offscreenExists = false })
    }
  }
  vi.stubGlobal('chrome', api)
  return {
    api,
    snapshot: () => structuredClone(items),
    sendMessageFrom,
    failNextStorageOperation: (message: string) => { nextStorageError = message }
  }
}
