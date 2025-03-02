import { initialState } from '@vk-audiopad/common'
import { atom, lsAtom } from '@/shared/lib/atom'
import { ModalPage } from './types'

export const themeAtom = lsAtom('theme', initialState.ApplicationSettings.theme)
export const activeModalPageAtom = atom<ModalPage | null>(null)

export const setSettingsModal = () => {
  activeModalPageAtom.set(ModalPage.SETTINGS)
}

export const setSignInModal = () => {
  activeModalPageAtom.set(ModalPage.SIGN_IN)
}

export const setRequestPermissionModal = () => {
  activeModalPageAtom.set(ModalPage.REQUEST_PERMISSION)
}

export const setLikeModal = () => {
  activeModalPageAtom.set(ModalPage.LIKE)
}
