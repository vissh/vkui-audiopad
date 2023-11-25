import { audioElement } from '../player'

export const onVolumeChange = (volume: number | undefined): void => {
  if (volume != null) {
    audioElement.volume = volume
  }
}
