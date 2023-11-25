import { initialState } from '@vk-audiopad/common'
import { storageAtom } from '@/shared/lib/atom'

export const shuffleAtom = storageAtom({
  key: 'shuffle',
  initial: initialState.ApplicationControls.shuffle,
  compareObjects: false
})
