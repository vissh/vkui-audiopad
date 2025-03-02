import { initialState } from '@vk-audiopad/common'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'

const CURRENT_LIKE_VERSION = 1
const CURRENT_SETTINGS_VERSION = 1

const likeVersionAtom = storageAtom({
  key: 'likeVersion',
  initial: initialState.ApplicationSettings.likeVersion,
  compareObjects: false
})

const settingsVersionAtom = storageAtom({
  key: 'settingsVersion',
  initial: initialState.ApplicationSettings.settingsVersion,
  compareObjects: false
})

export const useLikeNewVersion = (): boolean => {
  const prevValue = useAtomValue(likeVersionAtom)
  return prevValue !== CURRENT_LIKE_VERSION
}

export const useSettingsNewVersion = (): boolean => {
  const prevValue = useAtomValue(settingsVersionAtom)
  return prevValue !== CURRENT_SETTINGS_VERSION
}

export const updateLikeState = () => {
  likeVersionAtom.set(CURRENT_LIKE_VERSION)
}

export const updateSettingsState = () => {
  settingsVersionAtom.set(CURRENT_SETTINGS_VERSION)
}
