import { onDurationMode } from '../actions/duration-mode'
import { onPlayed } from '../actions/play-or-pause'
import { onShuffle } from '../actions/shuffle'
import { onVolumeChange } from '../actions/volume'
import { storage } from '../storage'

export const startListeningStorageEvents = (): void => {
  storage.durationMode.listen(onDurationMode)
  storage.volume.listen(onVolumeChange)
  storage.played.listen((played) => { void onPlayed(played) })
  storage.shuffle.listen((shuffle) => { void onShuffle(shuffle) })
}
