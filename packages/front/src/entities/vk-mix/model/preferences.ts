import { initialState, type vkMix } from '@vk-audiopad/common'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'

const preferences = storageAtom({ key: 'vkMixPreferences', initial: initialState.ApplicationSettings.vkMixPreferences, compareObjects: false })

export const rememberMix = (userId: string, options: string, title: string): void => {
  preferences.set({ ...preferences.get(), [userId]: { options, title } })
}

export const useMixPreferences = (userId: string): vkMix.MixPreferences | undefined => {
  const value = useAtomValue(preferences)[userId]
  return value != null && typeof value.options === 'string' && typeof value.title === 'string' ? value : undefined
}
