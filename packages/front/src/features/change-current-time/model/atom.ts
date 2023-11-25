import { initialState } from '@vk-audiopad/common'
import { storageAtom } from '@/shared/lib/atom'

export const durationModeAtom = storageAtom({
  key: 'durationMode',
  initial: initialState.ApplicationControls.durationMode,
  compareObjects: false
})
