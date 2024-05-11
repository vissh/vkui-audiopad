import { audioElement } from '../audio-element'

export const setCurrentTime = (value: number): void => {
  audioElement.currentTime = value
}
