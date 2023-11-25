import { initialState } from '@vk-audiopad/common'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'

const userIdAtom = storageAtom({
  key: 'userId',
  initial: initialState.User.userId,
  compareObjects: false
})

export const useSessionUserId = () => {
  return useAtomValue(userIdAtom)
}
