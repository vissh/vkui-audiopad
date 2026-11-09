import { useSyncExternalStore } from 'react'

const darkScheme = window.matchMedia('(prefers-color-scheme: dark)')
const subscribe = (listener: () => void) => {
  darkScheme.addEventListener('change', listener)
  return () => { darkScheme.removeEventListener('change', listener) }
}
const getSnapshot = () => darkScheme.matches ? 'dark' : 'light'

export const useSystemColorScheme = () => useSyncExternalStore(subscribe, getSnapshot)
