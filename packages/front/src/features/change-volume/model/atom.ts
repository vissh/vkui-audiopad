import { initialState } from '@vk-audiopad/common'
import { storageAtom } from '@/shared/lib/atom'

export const volumeAtom = storageAtom({
  key: 'volume',
  initial: initialState.ApplicationControls.volume,
  compareObjects: false
})

export const volumeBeforeMuteAtom = storageAtom({
  key: 'volumeBeforeMute',
  initial: initialState.ApplicationControls.volumeBeforeMute,
  compareObjects: false
})
