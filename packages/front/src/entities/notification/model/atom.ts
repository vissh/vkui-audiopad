import { atom, useAtomValue } from '@/shared/lib/atom'

const notificationAtom = atom<React.ReactNode | null>(null)

export const useNotification = () => {
  return useAtomValue(notificationAtom)
}

export const showNotification = (value: React.ReactNode | null): void => {
  notificationAtom.set(value)
}
