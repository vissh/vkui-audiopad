import { initialState } from '@vk-audiopad/common'
import { storageAtom } from '@/shared/lib/atom'

export const repeatAtom = storageAtom({
  key: 'repeat',
  initial: initialState.ApplicationControls.repeat,
  compareObjects: false
})
