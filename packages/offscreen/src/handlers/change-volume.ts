import { audioElement } from '../audio-element'

export const changeVolume = (value: number): void => {
  audioElement.volume = value
}
