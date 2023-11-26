import { initialState } from '@vk-audiopad/common'
import { atom, lsAtom } from '@/shared/lib/atom'
import { EModalPage } from './types'

export const themeAtom = lsAtom('theme', initialState.ApplicationSettings.theme)
export const activeModalPageAtom = atom<EModalPage | null>(null)

export const setInfoModal = () => {
  activeModalPageAtom.set(EModalPage.INFO)
}
