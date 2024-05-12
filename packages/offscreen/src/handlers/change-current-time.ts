import { audioElement } from '../audio-element'

export const changeCurrentTime = (value: number): void => {
  audioElement.currentTime = value
}
