import { initialState } from '@vk-audiopad/common'
import { atom, storageAtom, useAtomValue } from '@/shared/lib/atom'

const readyAtom = atom(false)

const userIdAtom = storageAtom({
  key: 'userId',
  initial: initialState.User.userId,
  compareObjects: false,
  onReady: () => { readyAtom.set(true) }
})

export const useSessionUserId = () => {
  return useAtomValue(userIdAtom)
}

export const useSessionReady = () => useAtomValue(readyAtom)
