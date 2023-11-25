import { initialState, type commonTypes } from '@vk-audiopad/common'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'
import { sendMessage } from '@/shared/lib/send-message'

const volumeAtom = storageAtom({
  key: 'volume',
  initial: initialState.ApplicationControls.volume,
  compareObjects: false
})

const durationModeAtom = storageAtom({
  key: 'durationMode',
  initial: initialState.ApplicationControls.durationMode,
  compareObjects: false
})

const repeatAtom = storageAtom({
  key: 'repeat',
  initial: initialState.ApplicationControls.repeat,
  compareObjects: false
})

const shuffleAtom = storageAtom({
  key: 'shuffle',
  initial: initialState.ApplicationControls.shuffle,
  compareObjects: false
})

export const useVolume = () => {
  return useAtomValue(volumeAtom)
}

export const setVolume = (volume: number) => {
  volumeAtom.set(volume)
}

export const useDurationMode = () => {
  return useAtomValue(durationModeAtom)
}

export const setDurationMode = (mode: commonTypes.DurationMode) => {
  durationModeAtom.set(mode)
}

export const useRepeat = () => {
  return useAtomValue(repeatAtom)
}

export const setRepeat = () => {
  sendMessage({ type: 'repeat' })
}

export const useShuffle = () => {
  return useAtomValue(shuffleAtom)
}

export const setShuffle = (shuffle: boolean) => {
  shuffleAtom.set(shuffle)
}
