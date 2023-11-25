import { useSyncExternalStore } from 'react'

interface Atom<AtomType> {
  get: () => AtomType
  set: (newValue: AtomType) => void
  subscribe: (callback: (newValue: AtomType) => void) => () => void
  mutate: (mutator: (newValue: AtomType, previousValue: AtomType) => void) => void
  watch: (watcher: (newValue: AtomType) => void) => void
}

export const useAtom = <T>(atom: Atom<T>): [T, (newValue: T) => void] => {
  return [useSyncExternalStore(atom.subscribe, atom.get), atom.set]
}

export const useAtomValue = <T>(atom: Atom<T>): T => {
  return useSyncExternalStore(atom.subscribe, atom.get)
}

export const atom = <T>(initialValue: T): Atom<T> => {
  let value = initialValue

  const subscribes = new Set<(newValue: T) => void>()
  const mutators = new Set<(newValue: T, previousValue: T) => void>()
  const watchers = new Set<(newValue: T) => void>()

  return {
    get: () => value,
    set: (newValue) => {
      if (value === newValue) {
        return
      }

      mutators.forEach((mutator) => { mutator(newValue, value) })

      value = newValue

      subscribes.forEach((callback) => { callback(value) })
      watchers.forEach((watcher) => { watcher(value) })
    },
    subscribe: (callback) => {
      subscribes.add(callback)
      return () => subscribes.delete(callback)
    },
    mutate: (mutator) => {
      mutators.add(mutator)
    },
    watch: (watcher) => {
      watchers.add(watcher)
    }
  }
}

export const storageAtom = <T>({
  key: keyName,
  initial: initialValue,
  default: defaultValue,
  compareObjects
}: {
  key: string
  initial: T
  default?: T
  compareObjects: ((previousValue: T | undefined, newValue: T | undefined) => boolean) | false
}
): Atom<T> => {
  let value = initialValue

  const subscribes = new Set<(newValue: T) => void>()
  const mutators = new Set<(newValue: T, previousValue: T) => void>()
  const watchers = new Set<(newValue: T) => void>()

  chrome.storage.local.get(keyName, (items) => {
    memorySet(items[keyName], true)
  })

  chrome.storage.local.onChanged.addListener((changes: Record<string, chrome.storage.StorageChange>) => {
    const change = changes[keyName]
    if (change != null) {
      memorySet(change.newValue, true)
    }
  })

  const memorySet = (newValue: T | undefined, fromStorage: boolean): boolean => {
    const safeNewValue = newValue ?? defaultValue ?? initialValue

    if (value === safeNewValue) {
      return false
    }

    if (fromStorage && compareObjects !== false && compareObjects(value, safeNewValue)) {
      return false
    }

    if (safeNewValue !== defaultValue && safeNewValue !== initialValue) {
      mutators.forEach((mutator) => { mutator(safeNewValue, value) })
    }

    value = safeNewValue

    subscribes.forEach(callback => { callback(value) })
    watchers.forEach(watcher => { watcher(value) })

    return true
  }

  return {
    get: () => value,
    set: (newValue) => {
      if (memorySet(newValue, false)) {
        void chrome.storage.local.set({ [keyName]: newValue })
      }
    },
    subscribe: (callback) => {
      subscribes.add(callback)
      return () => subscribes.delete(callback)
    },
    mutate: (mutator) => {
      mutators.add(mutator)
    },
    watch: (watcher) => {
      watchers.add(watcher)
    }
  }
}
