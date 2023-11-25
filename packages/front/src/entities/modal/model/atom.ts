import { initialState } from '@vk-audiopad/common'
import { atom, storageAtom } from '@/shared/lib/atom'
import { EModalPage } from './types'

export const activeModalPageAtom = atom<EModalPage | null>(null)

export const themeAtom = storageAtom({
  key: 'theme',
  initial: initialState.ApplicationSettings.theme,
  compareObjects: false
})

export const setInfoModal = () => {
  activeModalPageAtom.set(EModalPage.INFO)
}
