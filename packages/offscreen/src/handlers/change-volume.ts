import { audioElement } from '../audio-element'

export const setVolume = (value: number): void => {
  audioElement.volume = value
}
