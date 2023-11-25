import { atom } from '@/shared/lib/atom'

export const snackbarAtom = atom<React.ReactNode | null>(null)

export const setSnackbar = (value: React.ReactNode | null): void => {
  snackbarAtom.set(value)
}
